import { getLocalAuthHeaders } from "@/lib/local-auth-token";

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

async function getAuthHeaders() {
  return getLocalAuthHeaders();
}
async function fetchJsonData<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  const json = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: T;
    error?: string;
    message?: string;
  } | null;

  if (!response.ok || !json?.ok) {
    throw new Error(json?.error ?? json?.message ?? "Requête LocalFood impossible.");
  }

  return json.data as T;
}

export type AdminUsersOverviewProfile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

export type AdminUsersOverviewRole = {
  user_id: string;
  role: "superadmin" | "admin" | "user";
};

export type AdminUsersOverviewCompany = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type AdminUsersOverview = {
  profiles: AdminUsersOverviewProfile[];
  roles: AdminUsersOverviewRole[];
  companies: AdminUsersOverviewCompany[];
};

export async function fetchAdminUsersOverview(): Promise<AdminUsersOverview> {
  return fetchJsonData<AdminUsersOverview>(`${apiBaseUrl}/api/admin/users/overview`, {
    headers: await getAuthHeaders(),
  });
}

type CreateAdminUserPayload = {
  email: string;
  fullName: string;
  role: "admin" | "user";
  companyId: string;
  temporaryPassword: string;
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
  const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
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
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
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
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
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
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/company`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ companyId }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de modifier l’entreprise utilisateur.");
  }

  return json.data as UpdateAdminUserCompanyResponse;
}
