import { supabase } from "@/lib/supabase";

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

async function getAuthHeaders() {
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

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
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

export type AdminCompanyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdminCompanyRestaurantRow = {
  id: string;
  company_id: string | null;
};

export type AdminCompanyUserRow = {
  id: string;
  company_id: string;
};

export type AdminCompaniesOverview = {
  companies: AdminCompanyRow[];
  restaurants: AdminCompanyRestaurantRow[];
  companyUsers: AdminCompanyUserRow[];
};

export async function fetchAdminCompaniesOverview(): Promise<AdminCompaniesOverview> {
  return fetchJsonData<AdminCompaniesOverview>(`${apiBaseUrl}/api/admin/companies/overview`, {
    headers: await getAuthHeaders(),
  });
}

export async function createAdminCompany({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description: string | null;
}) {
  return fetchJsonData<AdminCompanyRow>(`${apiBaseUrl}/api/admin/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({
      name,
      slug,
      description,
      isActive: true,
    }),
  });
}

export async function updateAdminCompany({
  companyId,
  name,
  description,
  isActive,
}: {
  companyId: string;
  name: string;
  description: string | null;
  isActive: boolean;
}) {
  return fetchJsonData<AdminCompanyRow>(
    `${apiBaseUrl}/api/admin/companies/${encodeURIComponent(companyId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        name,
        description,
        isActive,
      }),
    },
  );
}
