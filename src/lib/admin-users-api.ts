import { supabase } from "@/lib/supabase";

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

type CreateAdminUserPayload = {
  email: string;
  fullName: string;
  role: "admin" | "user";
  companyId: string;
};

type CreateAdminUserResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
  companyId: string;
  companyName: string;
};

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<CreateAdminUserResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error("Session Supabase introuvable.");
  }

  const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de créer l’utilisateur.");
  }

  return json.data as CreateAdminUserResponse;
}
