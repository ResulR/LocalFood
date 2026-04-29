import type { NextFunction, Request, Response } from "express";
import { createSupabaseUserClient } from "../lib/supabase-server.js";
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

    const supabase = createSupabaseUserClient(accessToken);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new HttpError(401, "Invalid bearer token.", "AUTH_TOKEN_INVALID");
    }

    const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", {
      _user_id: userData.user.id,
    });

    if (roleError) {
      throw new HttpError(403, "Unable to verify user role.", "AUTH_ROLE_CHECK_FAILED");
    }

    request.auth = {
      accessToken,
      userId: userData.user.id,
      email: userData.user.email ?? null,
      role: roleData,
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