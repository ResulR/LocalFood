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

export type AdminRestaurantRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine_type: string;
  description: string;
  rating: number;
  reviews_count: number;
  price_level: number;
  price_label: "€" | "€€" | "€€€";
  is_open: boolean;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  is_active: boolean;
  company_id: string | null;
};

export async function fetchAdminRestaurantsList(): Promise<AdminRestaurantRow[]> {
  return fetchJsonData<AdminRestaurantRow[]>(`${apiBaseUrl}/api/admin/restaurants`, {
    headers: await getAuthHeaders(),
  });
}

export async function updateAdminRestaurantCompany({
  restaurantId,
  companyId,
}: {
  restaurantId: string;
  companyId: string | null;
}) {
  return fetchJsonData<{ id: string; company_id: string | null }>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/company`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ companyId }),
    },
  );
}

export async function updateAdminRestaurantStatus({
  restaurantId,
  isActive,
}: {
  restaurantId: string;
  isActive: boolean;
}) {
  return fetchJsonData<{ id: string; is_active: boolean }>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ isActive }),
    },
  );
}

export async function updateAdminRestaurant(payload: {
  restaurantId: string;
  name: string;
  category: string;
  cuisineType: string;
  description: string;
  priceLabel: "€" | "€€" | "€€€";
  isOpen: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
}) {
  return fetchJsonData<{ id: string }>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(payload.restaurantId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(payload),
    },
  );
}
