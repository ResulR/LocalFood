import type { NextFunction, Request, Response } from "express";
import { dbQuery } from "../lib/db.js";
import { verifyLocalAuthToken } from "../lib/local-auth.js";
import { HttpError } from "./error-handler.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        accessToken: string;
        userId: string;
        email: string | null;
        role: "superadmin" | "admin" | "user" | null;
        jti: string;
        tokenExpiresAt: number;
      };
    }
  }
}

type ProfileRow = {
  user_id: string;
  email: string | null;
  is_active: boolean;
};

type UserRoleRow = {
  role: "superadmin" | "admin" | "user";
};

function getBearerToken(request: Request) {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      throw new HttpError(401, "Missing bearer token.", "AUTH_TOKEN_MISSING");
    }

    let tokenPayload: { userId: string; jti?: string; exp?: number };

    try {
      tokenPayload = verifyLocalAuthToken(accessToken);
    } catch {
      throw new HttpError(401, "Invalid bearer token.", "AUTH_TOKEN_INVALID");
    }

    if (!tokenPayload.jti || !tokenPayload.exp) {
      throw new HttpError(401, "Invalid bearer token.", "AUTH_TOKEN_INVALID");
    }

    const revokedTokenResult = await dbQuery<{ found: number }>(
      `
        select 1 as found
        from public.revoked_tokens
        where jti = $1
          and expires_at > now()
        limit 1
      `,
      [tokenPayload.jti],
    );

    if (revokedTokenResult.rows[0]) {
      throw new HttpError(401, "Revoked bearer token.", "AUTH_TOKEN_REVOKED");
    }

    const [profileResult, roleResult] = await Promise.all([
      dbQuery<ProfileRow>(
        `
          select
            user_id,
            email,
            is_active
          from public.profiles
          where user_id = $1
          limit 1
        `,
        [tokenPayload.userId],
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
        [tokenPayload.userId],
      ),
    ]);

    const profile = profileResult.rows[0];

    if (!profile) {
      throw new HttpError(401, "Invalid bearer token.", "AUTH_TOKEN_INVALID");
    }

    if (!profile.is_active) {
      throw new HttpError(403, "User account is disabled.", "USER_DISABLED");
    }

    request.auth = {
      accessToken,
      userId: profile.user_id,
      email: profile.email,
      role: roleResult.rows[0]?.role ?? null,
      jti: tokenPayload.jti,
      tokenExpiresAt: tokenPayload.exp,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireSuperAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.auth?.role !== "superadmin") {
    next(new HttpError(403, "SuperAdmin access required.", "SUPERADMIN_REQUIRED"));
    return;
  }

  next();
}