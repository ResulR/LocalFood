import { Router } from "express";
import { z } from "zod";
import { createSupabaseAdminClient } from "../../lib/supabase-server.js";
import { requireAuth, requireSuperAdmin } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminUsersRouter = Router();

const createAdminUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "user"]),
  companyId: z.string().uuid(),
});

adminUsersRouter.post("/", requireAuth, requireSuperAdmin, async (request, response, next) => {
  try {
    const payload = createAdminUserSchema.parse(request.body);
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name, is_active")
      .eq("id", payload.companyId)
      .maybeSingle();

    if (companyError) {
      throw new HttpError(500, companyError.message, "COMPANY_LOOKUP_FAILED");
    }

    if (!company) {
      throw new HttpError(404, "Company not found.", "COMPANY_NOT_FOUND");
    }

    if (!company.is_active) {
      throw new HttpError(400, "Company is inactive.", "COMPANY_INACTIVE");
    }

    const { data: invitedUserData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(payload.email, {
        data: {
          full_name: payload.fullName,
        },
      });

    if (inviteError) {
      throw new HttpError(400, inviteError.message, "USER_INVITE_FAILED");
    }

    const invitedUser = invitedUserData.user;

    if (!invitedUser) {
      throw new HttpError(500, "Supabase did not return the invited user.", "USER_INVITE_EMPTY");
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: invitedUser.id,
        email: payload.email,
        full_name: payload.fullName,
        current_company_id: payload.companyId,
        is_active: true,
      },
      {
        onConflict: "user_id",
      },
    );

    if (profileError) {
      throw new HttpError(500, profileError.message, "PROFILE_UPSERT_FAILED");
    }

    const { error: deleteRoleError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", invitedUser.id);

    if (deleteRoleError) {
      throw new HttpError(500, deleteRoleError.message, "USER_ROLE_RESET_FAILED");
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: invitedUser.id,
      role: payload.role,
    });

    if (roleError) {
      throw new HttpError(500, roleError.message, "USER_ROLE_INSERT_FAILED");
    }

    const { error: deleteMembershipsError } = await supabaseAdmin
      .from("company_users")
      .delete()
      .eq("user_id", invitedUser.id);

    if (deleteMembershipsError) {
      throw new HttpError(500, deleteMembershipsError.message, "COMPANY_MEMBERSHIP_RESET_FAILED");
    }

    const { error: membershipError } = await supabaseAdmin.from("company_users").insert({
      user_id: invitedUser.id,
      company_id: payload.companyId,
    });

    if (membershipError) {
      throw new HttpError(500, membershipError.message, "COMPANY_MEMBERSHIP_INSERT_FAILED");
    }

    response.status(201).json({
      ok: true,
      data: {
        userId: invitedUser.id,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        companyId: payload.companyId,
        companyName: company.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});