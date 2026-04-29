import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export function createSupabaseUserClient(accessToken: string) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase server user client is not configured.");
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}