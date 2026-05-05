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

const updateAdminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const updateAdminUserRoleSchema = z.object({
  role: z.enum(["superadmin", "admin", "user"]),
});

const updateAdminUserCompanySchema = z.object({
  companyId: z.string().uuid().nullable(),
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

adminUsersRouter.patch(
  "/:userId/status",
  requireAuth,
  requireSuperAdmin,
  async (request, response, next) => {
    try {
      const paramsSchema = z.object({
        userId: z.string().uuid(),
      });

      const { userId } = paramsSchema.parse(request.params);
      const payload = updateAdminUserStatusSchema.parse(request.body);
      const supabaseAdmin = createSupabaseAdminClient();

      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        throw new HttpError(500, roleError.message, "USER_ROLE_LOOKUP_FAILED");
      }

      if (!roleData) {
        throw new HttpError(404, "User role not found.", "USER_ROLE_NOT_FOUND");
      }

      if (roleData.role === "superadmin" && payload.isActive === false) {
        const { count, error: countError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, user_roles!inner(role)", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("user_roles.role", "superadmin");

        if (countError) {
          throw new HttpError(500, countError.message, "SUPERADMIN_COUNT_FAILED");
        }

        if ((count ?? 0) <= 1) {
          throw new HttpError(
            400,
            "Cannot deactivate the last active SuperAdmin.",
            "LAST_SUPERADMIN_ACTIVE",
          );
        }
      }

      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_active: payload.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("user_id, email, full_name, is_active")
        .maybeSingle();

      if (updateError) {
        throw new HttpError(500, updateError.message, "PROFILE_STATUS_UPDATE_FAILED");
      }

      if (!updatedProfile) {
        throw new HttpError(404, "Profile not found.", "PROFILE_NOT_FOUND");
      }

      response.json({
        ok: true,
        data: {
          userId: updatedProfile.user_id,
          email: updatedProfile.email,
          fullName: updatedProfile.full_name,
          isActive: updatedProfile.is_active,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminUsersRouter.patch(
  "/:userId/role",
  requireAuth,
  requireSuperAdmin,
  async (request, response, next) => {
    try {
      const paramsSchema = z.object({
        userId: z.string().uuid(),
      });

      const { userId } = paramsSchema.parse(request.params);
      const payload = updateAdminUserRoleSchema.parse(request.body);
      const supabaseAdmin = createSupabaseAdminClient();

      const { data: currentRoleData, error: currentRoleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentRoleError) {
        throw new HttpError(500, currentRoleError.message, "USER_ROLE_LOOKUP_FAILED");
      }

      if (!currentRoleData) {
        throw new HttpError(404, "User role not found.", "USER_ROLE_NOT_FOUND");
      }

      if (currentRoleData.role === "superadmin" && payload.role !== "superadmin") {
        const { count, error: countError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, user_roles!inner(role)", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("user_roles.role", "superadmin");

        if (countError) {
          throw new HttpError(500, countError.message, "SUPERADMIN_COUNT_FAILED");
        }

        if ((count ?? 0) <= 1) {
          throw new HttpError(
            400,
            "Cannot remove the last active SuperAdmin role.",
            "LAST_SUPERADMIN_ROLE",
          );
        }
      }

      const { error: deleteRoleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteRoleError) {
        throw new HttpError(500, deleteRoleError.message, "USER_ROLE_RESET_FAILED");
      }

      const { data: insertedRole, error: insertRoleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: payload.role,
        })
        .select("user_id, role")
        .maybeSingle();

      if (insertRoleError) {
        throw new HttpError(500, insertRoleError.message, "USER_ROLE_INSERT_FAILED");
      }

      if (!insertedRole) {
        throw new HttpError(500, "Role insert returned no data.", "USER_ROLE_INSERT_EMPTY");
      }

      response.json({
        ok: true,
        data: {
          userId: insertedRole.user_id,
          role: insertedRole.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminUsersRouter.patch(
  "/:userId/company",
  requireAuth,
  requireSuperAdmin,
  async (request, response, next) => {
    try {
      const paramsSchema = z.object({
        userId: z.string().uuid(),
      });

      const { userId } = paramsSchema.parse(request.params);
      const payload = updateAdminUserCompanySchema.parse(request.body);
      const supabaseAdmin = createSupabaseAdminClient();

      if (payload.companyId) {
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
      }

      const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          current_company_id: payload.companyId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("user_id, email, full_name, current_company_id")
        .maybeSingle();

      if (profileError) {
        throw new HttpError(500, profileError.message, "PROFILE_COMPANY_UPDATE_FAILED");
      }

      if (!updatedProfile) {
        throw new HttpError(404, "Profile not found.", "PROFILE_NOT_FOUND");
      }

      const { error: deleteMembershipsError } = await supabaseAdmin
        .from("company_users")
        .delete()
        .eq("user_id", userId);

      if (deleteMembershipsError) {
        throw new HttpError(500, deleteMembershipsError.message, "COMPANY_MEMBERSHIP_RESET_FAILED");
      }

      if (payload.companyId) {
        const { error: membershipError } = await supabaseAdmin.from("company_users").insert({
          user_id: userId,
          company_id: payload.companyId,
        });

        if (membershipError) {
          throw new HttpError(500, membershipError.message, "COMPANY_MEMBERSHIP_INSERT_FAILED");
        }
      }

      response.json({
        ok: true,
        data: {
          userId: updatedProfile.user_id,
          email: updatedProfile.email,
          fullName: updatedProfile.full_name,
          companyId: updatedProfile.current_company_id,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);
