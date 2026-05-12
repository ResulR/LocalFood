import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type LocalAuthTokenPayload = {
  userId: string;
  email: string;
  jti: string;
};

type CreateLocalAuthTokenPayload = Omit<LocalAuthTokenPayload, "jti">;

const passwordSaltRounds = 12;

function getLocalAuthSecret() {
  if (!env.LOCAL_AUTH_JWT_SECRET) {
    throw new Error("LOCAL_AUTH_JWT_SECRET is not configured.");
  }

  return env.LOCAL_AUTH_JWT_SECRET;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, passwordSaltRounds);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createLocalAuthToken(payload: CreateLocalAuthTokenPayload) {
  const signOptions: SignOptions = {
    expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(),
    },
    getLocalAuthSecret(),
    signOptions,
  );
}

export function verifyLocalAuthToken(token: string) {
  return jwt.verify(token, getLocalAuthSecret()) as LocalAuthTokenPayload;
}