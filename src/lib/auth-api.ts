import { getLocalAuthHeaders } from "@/lib/local-auth-token";

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

type ChangeLocalPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changeLocalPassword(payload: ChangeLocalPasswordPayload) {
  const response = await fetch(`${apiBaseUrl}/api/auth/local/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getLocalAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: {
      passwordChanged: boolean;
    };
    error?: string;
    message?: string;
  } | null;

  if (!response.ok || !json?.ok) {
    throw new Error(json?.message ?? json?.error ?? "Impossible de modifier le mot de passe.");
  }

  return json.data;
}
