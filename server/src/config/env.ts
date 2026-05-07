import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  DATABASE_URL: z.string().optional(),

  LOCAL_AUTH_JWT_SECRET: z.string().min(32).optional(),
  LOCAL_AUTH_JWT_EXPIRES_IN: z.string().default("7d"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4-mini"),

  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().positive().default(20),
});

export const env = envSchema.parse(process.env);
