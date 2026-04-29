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

type UpdateAdminUserStatusResponse = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
};

export async function updateAdminUserStatus({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}): Promise<UpdateAdminUserStatusResponse> {
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

  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de modifier le statut utilisateur.");
  }

  return json.data as UpdateAdminUserStatusResponse;
}

type UpdateAdminUserRoleResponse = {
  userId: string;
  role: "superadmin" | "admin" | "user";
};

export async function updateAdminUserRole({
  userId,
  role,
}: {
  userId: string;
  role: "superadmin" | "admin" | "user";
}): Promise<UpdateAdminUserRoleResponse> {
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

  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ role }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de modifier le rôle utilisateur.");
  }

  return json.data as UpdateAdminUserRoleResponse;
}

type UpdateAdminUserCompanyResponse = {
  userId: string;
  email: string | null;
  fullName: string | null;
  companyId: string | null;
};

export async function updateAdminUserCompany({
  userId,
  companyId,
}: {
  userId: string;
  companyId: string | null;
}): Promise<UpdateAdminUserCompanyResponse> {
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

  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/company`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ companyId }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de modifier l’entreprise utilisateur.");
  }

  return json.data as UpdateAdminUserCompanyResponse;
}
