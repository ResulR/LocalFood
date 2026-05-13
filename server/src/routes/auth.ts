import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { dbQuery } from "../lib/db.js";
import { createLocalAuthToken, hashPassword, verifyPassword } from "../lib/local-auth.js";
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

type LocalAuthUserRow = {
  user_id: string;
  email: string;
  password_hash: string | null;
  password_set: boolean;
  is_active: boolean;
  must_change_password: boolean;
};

const localLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200),
});

const setLocalPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

const changeLocalPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

const localLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    code: "LOGIN_RATE_LIMIT_EXCEEDED",
    message: "Trop de tentatives de connexion. Réessayez plus tard.",
  },
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


authRouter.get("/me/export", requireAuth, async (request, response, next) => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    const [
      profileResult,
      rolesResult,
      companiesResult,
      localAuthResult,
      restaurantsResult,
    ] = await Promise.all([
      dbQuery(
        `
          select
            id,
            user_id,
            email,
            full_name,
            is_active,
            current_company_id,
            deletion_requested_at,
            created_at,
            updated_at
          from public.profiles
          where user_id = $1
          limit 1
        `,
        [userId],
      ),
      dbQuery(
        `
          select role, created_at
          from public.user_roles
          where user_id = $1
          order by role asc
        `,
        [userId],
      ),
      dbQuery(
        `
          select
            c.id,
            c.name,
            c.slug,
            c.description,
            c.is_active,
            c.created_at,
            c.updated_at,
            cu.created_at as member_since
          from public.company_users cu
          join public.companies c on c.id = cu.company_id
          where cu.user_id = $1
          order by c.name asc
        `,
        [userId],
      ),
      dbQuery(
        `
          select
            user_id,
            email,
            password_set,
            is_active,
            must_change_password,
            last_login_at,
            deletion_requested_at,
            created_at,
            updated_at
          from public.local_auth_users
          where user_id = $1
          limit 1
        `,
        [userId],
      ),
      dbQuery(
        `
          select
            r.id,
            r.name,
            r.slug,
            r.category,
            r.cuisine_type,
            r.description,
            r.main_image_url,
            r.rating,
            r.reviews_count,
            r.price_label,
            r.is_open,
            r.hours_summary,
            r.address,
            r.city,
            r.country,
            r.phone,
            r.menu_url,
            r.google_maps_url,
            r.waze_url,
            r.is_active,
            r.company_id,
            r.created_at,
            r.updated_at
          from public.company_users cu
          join public.restaurants r on r.company_id = cu.company_id
          where cu.user_id = $1
          order by r.name asc
        `,
        [userId],
      ),
    ]);

    response.json({
      ok: true,
      data: {
        exportedAt: new Date().toISOString(),
        userId,
        profile: profileResult.rows[0] ?? null,
        roles: rolesResult.rows,
        companies: companiesResult.rows,
        localAuth: localAuthResult.rows[0] ?? null,
        restaurants: restaurantsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.delete("/me", requireAuth, async (request, response, next) => {
  try {
    const auth = request.auth;

    if (!auth?.userId || !auth.jti || !auth.tokenExpiresAt) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    if (auth.role === "superadmin") {
      response.status(403).json({
        ok: false,
        message:
          "Un compte SuperAdmin ne peut pas être supprimé depuis l'interface. Utilisez une procédure manuelle contrôlée.",
      });
      return;
    }

    await dbQuery("begin");

    try {
      await dbQuery(
        `
          update public.profiles
          set
            is_active = false,
            deletion_requested_at = coalesce(deletion_requested_at, now()),
            updated_at = now()
          where user_id = $1
        `,
        [auth.userId],
      );

      await dbQuery(
        `
          update public.local_auth_users
          set
            is_active = false,
            deletion_requested_at = coalesce(deletion_requested_at, now()),
            updated_at = now()
          where user_id = $1
        `,
        [auth.userId],
      );

      await dbQuery(
        `
          insert into public.revoked_tokens (
            jti,
            user_id,
            expires_at
          )
          values ($1, $2, to_timestamp($3))
          on conflict (jti) do nothing
        `,
        [auth.jti, auth.userId, auth.tokenExpiresAt],
      );

      await dbQuery("commit");
    } catch (error) {
      await dbQuery("rollback");
      throw error;
    }

    response.json({
      ok: true,
      data: {
        deleted: true,
        deletionMode: "soft",
        purgeEligibleAfterDays: 30,
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

authRouter.post("/local/change-password", requireAuth, async (request, response, next) => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    const parsed = changeLocalPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        ok: false,
        message:
          "Mot de passe invalide. Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    const authUserResult = await dbQuery<LocalAuthUserRow>(
      `
        select
          user_id,
          email,
          password_hash,
          password_set,
          is_active,
          must_change_password
        from public.local_auth_users
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    const authUser = authUserResult.rows[0];

    if (!authUser) {
      response.status(404).json({
        ok: false,
        message: "Compte local introuvable.",
      });
      return;
    }

    if (!authUser.is_active) {
      response.status(403).json({
        ok: false,
        message: "Compte utilisateur désactivé.",
      });
      return;
    }

    if (!authUser.password_hash || !authUser.password_set) {
      response.status(400).json({
        ok: false,
        message: "Aucun mot de passe local n'est défini pour ce compte.",
      });
      return;
    }

    const currentPasswordMatches = await verifyPassword(
      parsed.data.currentPassword,
      authUser.password_hash,
    );

    if (!currentPasswordMatches) {
      response.status(401).json({
        ok: false,
        message: "Mot de passe actuel incorrect.",
      });
      return;
    }

    const newPasswordHash = await hashPassword(parsed.data.newPassword);

    await dbQuery(
      `
        update public.local_auth_users
        set
          password_hash = $2,
          password_set = true,
          must_change_password = false,
          updated_at = now()
        where user_id = $1
      `,
      [userId, newPasswordHash],
    );

    response.json({
      ok: true,
      data: {
        passwordChanged: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/local/logout", requireAuth, async (request, response, next) => {
  try {
    const auth = request.auth;

    if (!auth?.jti || !auth.userId || !auth.tokenExpiresAt) {
      response.status(401).json({
        ok: false,
        message: "Utilisateur non authentifié.",
      });
      return;
    }

    await dbQuery(
      `
        insert into public.revoked_tokens (
          jti,
          user_id,
          expires_at
        )
        values ($1, $2, to_timestamp($3))
        on conflict (jti) do nothing
      `,
      [auth.jti, auth.userId, auth.tokenExpiresAt],
    );

    response.json({
      ok: true,
      data: {
        loggedOut: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/local/login", localLoginRateLimiter, async (request, response, next) => {
  try {
    const parsed = localLoginSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        ok: false,
        message: "Identifiants invalides.",
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();

    const authUserResult = await dbQuery<LocalAuthUserRow>(
      `
        select
          user_id,
          email,
          password_hash,
          password_set,
          is_active,
          must_change_password
        from public.local_auth_users
        where lower(email) = $1
        limit 1
      `,
      [email],
    );

    const authUser = authUserResult.rows[0];

    if (!authUser?.password_hash || !authUser.password_set) {
      response.status(401).json({
        ok: false,
        message: "Identifiants invalides.",
      });
      return;
    }

    if (!authUser.is_active) {
      response.status(403).json({
        ok: false,
        message: "Compte utilisateur désactivé.",
      });
      return;
    }

    const passwordMatches = await verifyPassword(parsed.data.password, authUser.password_hash);

    if (!passwordMatches) {
      response.status(401).json({
        ok: false,
        message: "Identifiants invalides.",
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
        [authUser.user_id],
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
        [authUser.user_id],
      ),
    ]);

    const profile = profileResult.rows[0];

    if (!profile?.is_active) {
      response.status(403).json({
        ok: false,
        message: "Compte utilisateur désactivé.",
      });
      return;
    }

    const token = createLocalAuthToken({
      userId: authUser.user_id,
      email: authUser.email,
    });

    await dbQuery(
      `
        update public.local_auth_users
        set last_login_at = now()
        where user_id = $1
      `,
      [authUser.user_id],
    );

    response.json({
      ok: true,
      data: {
        token,
        profile,
        role: roleResult.rows[0]?.role ?? null,
        mustChangePassword: authUser.must_change_password,
      },
    });
  } catch (error) {
    next(error);
  }
});
