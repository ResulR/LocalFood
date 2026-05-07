import { Router } from "express";
import { dbQuery } from "../lib/db.js";
import { requireAuth } from "../middlewares/auth.js";

type ProfileRow = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

type UserRoleRow = {
  role: "superadmin" | "admin" | "user";
};

export const authRouter = Router();

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    const [profileResult, roleResult] = await Promise.all([
      dbQuery<ProfileRow>(
        `
          select
            id,
            user_id,
            email,
            full_name,
            is_active,
            current_company_id
          from public.profiles
          where user_id = $1
          limit 1
        `,
        [userId],
      ),
      dbQuery<UserRoleRow>(
        `
          select role
          from public.user_roles
          where user_id = $1
          order by
            case role
              when 'superadmin' then 1
              when 'admin' then 2
              when 'user' then 3
            end
          limit 1
        `,
        [userId],
      ),
    ]);

    response.json({
      ok: true,
      data: {
        profile: profileResult.rows[0] ?? null,
        role: roleResult.rows[0]?.role ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
});