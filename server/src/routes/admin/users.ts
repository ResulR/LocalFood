import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { dbQuery } from "../../lib/db.js";
import { hashPassword } from "../../lib/local-auth.js";
import { requireAuth, requireSuperAdmin } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminUsersRouter = Router();

type ProfileOverviewRow = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

type UserRoleOverviewRow = {
  user_id: string;
  role: "superadmin" | "admin" | "user";
};

type CompanyOverviewRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

const createAdminUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "user"]),
  companyId: z.string().uuid(),
  temporaryPassword: z.string().min(8).max(200),
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

adminUsersRouter.get(
  "/overview",
  requireAuth,
  requireSuperAdmin,
  async (_request, response, next) => {
    try {
      const [profilesResult, rolesResult, companiesResult] = await Promise.all([
        dbQuery<ProfileOverviewRow>(
          `
          select
            id,
            user_id,
            email,
            full_name,
            is_active,
            current_company_id
          from public.profiles
          order by created_at desc
        `,
        ),
        dbQuery<UserRoleOverviewRow>(
          `
          select
            user_id,
            role
          from public.user_roles
        `,
        ),
        dbQuery<CompanyOverviewRow>(
          `
          select
            id,
            name,
            slug,
            is_active
          from public.companies
          order by name asc
        `,
        ),
      ]);

      response.json({
        ok: true,
        data: {
          profiles: profilesResult.rows,
          roles: rolesResult.rows,
          companies: companiesResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

adminUsersRouter.post("/", requireAuth, requireSuperAdmin, async (request, response, next) => {
  try {
    const payload = createAdminUserSchema.parse(request.body);
    const email = payload.email.trim().toLowerCase();
    const userId = randomUUID();

    const companyResult = await dbQuery<{ id: string; name: string; is_active: boolean }>(
      `
        select id, name, is_active
        from public.companies
        where id = $1
        limit 1
      `,
      [payload.companyId],
    );

    const company = companyResult.rows[0];

    if (!company) {
      throw new HttpError(404, "Company not found.", "COMPANY_NOT_FOUND");
    }

    if (!company.is_active) {
      throw new HttpError(400, "Company is inactive.", "COMPANY_INACTIVE");
    }

    const existingUserResult = await dbQuery<{ user_id: string }>(
      `
        select user_id
        from public.local_auth_users
        where lower(email) = $1
        limit 1
      `,
      [email],
    );

    if (existingUserResult.rows[0]) {
      throw new HttpError(409, "User already exists.", "USER_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(payload.temporaryPassword);

    await dbQuery(
      `
        insert into public.profiles (
          user_id,
          email,
          full_name,
          current_company_id,
          is_active
        )
        values ($1, $2, $3, $4, true)
      `,
      [userId, email, payload.fullName, payload.companyId],
    );

    await dbQuery(
      `
        insert into public.user_roles (
          user_id,
          role
        )
        values ($1, $2)
      `,
      [userId, payload.role],
    );

    await dbQuery(
      `
        insert into public.company_users (
          user_id,
          company_id
        )
        values ($1, $2)
      `,
      [userId, payload.companyId],
    );

    await dbQuery(
      `
        insert into public.local_auth_users (
          user_id,
          email,
          password_hash,
          password_set,
          is_active
        )
        values ($1, $2, $3, true, true)
      `,
      [userId, email, passwordHash],
    );

    response.status(201).json({
      ok: true,
      data: {
        userId,
        email,
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
      const roleResult = await dbQuery<{ role: "superadmin" | "admin" | "user" }>(
        `
          select role
          from public.user_roles
          where user_id = $1
          limit 1
        `,
        [userId],
      );

      const roleData = roleResult.rows[0];

      if (!roleData) {
        throw new HttpError(404, "User role not found.", "USER_ROLE_NOT_FOUND");
      }

      if (roleData.role === "superadmin" && payload.isActive === false) {
        const countResult = await dbQuery<{ count: string }>(
          `
            select count(*)::text as count
            from public.profiles p
            join public.user_roles ur on ur.user_id = p.user_id
            where p.is_active = true
              and ur.role = 'superadmin'
          `,
        );

        const count = Number(countResult.rows[0]?.count ?? 0);

        if (count <= 1) {
          throw new HttpError(
            400,
            "Cannot deactivate the last active SuperAdmin.",
            "LAST_SUPERADMIN_ACTIVE",
          );
        }
      }

      const profileResult = await dbQuery<{
        user_id: string;
        email: string | null;
        full_name: string | null;
        is_active: boolean;
      }>(
        `
          update public.profiles
          set
            is_active = $2,
            updated_at = now()
          where user_id = $1
          returning user_id, email, full_name, is_active
        `,
        [userId, payload.isActive],
      );

      const updatedProfile = profileResult.rows[0];

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
      const currentRoleResult = await dbQuery<{ role: "superadmin" | "admin" | "user" }>(
        `
          select role
          from public.user_roles
          where user_id = $1
          limit 1
        `,
        [userId],
      );

      const currentRoleData = currentRoleResult.rows[0];

      if (!currentRoleData) {
        throw new HttpError(404, "User role not found.", "USER_ROLE_NOT_FOUND");
      }

      if (currentRoleData.role === "superadmin" && payload.role !== "superadmin") {
        const countResult = await dbQuery<{ count: string }>(
          `
            select count(*)::text as count
            from public.profiles p
            join public.user_roles ur on ur.user_id = p.user_id
            where p.is_active = true
              and ur.role = 'superadmin'
          `,
        );

        const count = Number(countResult.rows[0]?.count ?? 0);

        if (count <= 1) {
          throw new HttpError(
            400,
            "Cannot remove the last active SuperAdmin role.",
            "LAST_SUPERADMIN_ROLE",
          );
        }
      }

      await dbQuery(
        `
          delete from public.user_roles
          where user_id = $1
        `,
        [userId],
      );

      const insertedRoleResult = await dbQuery<{
        user_id: string;
        role: "superadmin" | "admin" | "user";
      }>(
        `
          insert into public.user_roles (
            user_id,
            role
          )
          values ($1, $2)
          returning user_id, role
        `,
        [userId, payload.role],
      );

      const insertedRole = insertedRoleResult.rows[0];

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
      if (payload.companyId) {
        const companyResult = await dbQuery<{ id: string; name: string; is_active: boolean }>(
          `
            select id, name, is_active
            from public.companies
            where id = $1
            limit 1
          `,
          [payload.companyId],
        );

        const company = companyResult.rows[0];

        if (!company) {
          throw new HttpError(404, "Company not found.", "COMPANY_NOT_FOUND");
        }

        if (!company.is_active) {
          throw new HttpError(400, "Company is inactive.", "COMPANY_INACTIVE");
        }
      }

      const profileResult = await dbQuery<{
        user_id: string;
        email: string | null;
        full_name: string | null;
        current_company_id: string | null;
      }>(
        `
          update public.profiles
          set
            current_company_id = $2,
            updated_at = now()
          where user_id = $1
          returning user_id, email, full_name, current_company_id
        `,
        [userId, payload.companyId],
      );

      const updatedProfile = profileResult.rows[0];

      if (!updatedProfile) {
        throw new HttpError(404, "Profile not found.", "PROFILE_NOT_FOUND");
      }

      await dbQuery(
        `
          delete from public.company_users
          where user_id = $1
        `,
        [userId],
      );

      if (payload.companyId) {
        await dbQuery(
          `
            insert into public.company_users (
              user_id,
              company_id
            )
            values ($1, $2)
          `,
          [userId, payload.companyId],
        );
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
