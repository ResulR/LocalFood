import type { NextFunction, Request, Response } from "express";
import { createSupabaseUserClient } from "../lib/supabase-server.js";
import { dbQuery } from "../lib/db.js";
import { HttpError } from "./error-handler.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        accessToken: string;
        userId: string;
        email: string | null;
        role: "superadmin" | "admin" | "user" | null;
      };
    }
  }
}

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

    let supabase;

    try {
      supabase = createSupabaseUserClient(accessToken);
    } catch {
      throw new HttpError(
        503,
        "Server authentication is not configured.",
        "SERVER_AUTH_NOT_CONFIGURED",
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new HttpError(401, "Invalid bearer token.", "AUTH_TOKEN_INVALID");
    }

    const roleResult = await dbQuery<UserRoleRow>(
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
      [userData.user.id],
    );

    request.auth = {
      accessToken,
      userId: userData.user.id,
      email: userData.user.email ?? null,
      role: roleResult.rows[0]?.role ?? null,
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