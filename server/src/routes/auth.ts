import { Router } from "express";
import { z } from "zod";
import { dbQuery } from "../lib/db.js";
import { hashPassword } from "../lib/local-auth.js";
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

const setLocalPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

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

authRouter.post("/local/set-password", requireAuth, async (request, response, next) => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    const parsed = setLocalPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        ok: false,
        message: "Mot de passe invalide. Il doit contenir au moins 8 caractères.",
      });
      return;
    }

    const profileResult = await dbQuery<ProfileRow>(
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
    );

    const profile = profileResult.rows[0];

    if (!profile?.email) {
      response.status(404).json({
        ok: false,
        message: "Profil utilisateur introuvable.",
      });
      return;
    }

    if (!profile.is_active) {
      response.status(403).json({
        ok: false,
        message: "Compte utilisateur désactivé.",
      });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await dbQuery(
      `
        insert into public.local_auth_users (
          user_id,
          email,
          password_hash,
          password_set,
          is_active
        )
        values ($1, $2, $3, true, $4)
        on conflict (user_id) do update
        set
          email = excluded.email,
          password_hash = excluded.password_hash,
          password_set = true,
          is_active = excluded.is_active,
          updated_at = now()
      `,
      [profile.user_id, profile.email, passwordHash, profile.is_active],
    );

    response.json({
      ok: true,
      data: {
        passwordSet: true,
      },
    });
  } catch (error) {
    next(error);
  }
});