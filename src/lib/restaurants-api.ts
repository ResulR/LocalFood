import { getLocalAuthHeaders } from "@/lib/local-auth-token";

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

export type AIRestaurantSearchResult = {
  answer: string;
  detectedTags: {
    label: string;
    slug: string;
  }[];
  recommendations: RestaurantAIRecommendation[];
};

export type RestaurantAIRecommendation = {
  id: string;
  slug: string;
  name: string;
  category: string;
  cuisineType: string;
  description: string;
  imageUrl: string | null;
  rating: number;
  reviewsCount: number;
  priceLabel: "€" | "€€" | "€€€";
  isOpen: boolean;
  hoursSummary: string | null;
  address: string;
  city: string;
  phone: string | null;
  menuUrl: string | null;
  googleMapsUrl: string | null;
  wazeUrl: string | null;
  tags: SupabaseRestaurantTag[];
  badges: SupabaseRestaurantBadge[];
  offer: SupabaseRestaurantOffer | null;
  matchScore: number;
  matchReasons: string[];
};

export async function searchRestaurantsWithAI(message: string): Promise<AIRestaurantSearchResult> {
  const response = await fetch(`${apiBaseUrl}/api/public/ai/restaurant-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const payload = (await response.json()) as {
    ok: boolean;
    data?: AIRestaurantSearchResult;
    message?: string;
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.message ?? "Impossible de contacter l'assistant LocalFood.");
  }

  return payload.data;
}

async function fetchJsonData<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: T;
    message?: string;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message ?? "Requête LocalFood impossible.");
  }

  return payload.data as T;
}

async function getAuthHeaders() {
  return getLocalAuthHeaders();
}

export type SupabaseRestaurantTag = {
  label: string;
  slug: string;
};

export type SupabaseRestaurantBadge = {
  label: string;
  slug: string;
};

export type SupabaseRestaurantPhoto = {
  id: string;
  url: string;
  category: string;
  is_client_photo: boolean;
  author_name: string | null;
  sort_order: number;
};

export type SupabaseRestaurantOpeningHour = {
  id: string;
  day_of_week: number;
  day_label: string;
  hours_text: string;
  is_closed: boolean;
};

export type SupabaseRestaurantOffer = {
  id: string;
  code: string;
  title: string;
  description: string;
  conditions: string | null;
  is_active: boolean;
};

export type SupabaseRestaurantListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine_type: string;
  description: string;
  main_image_url: string | null;
  rating: number;
  reviews_count: number;
  distance_km: number | null;
  latitude: number | null;
  longitude: number | null;
  price_level: number;
  price_label: "€" | "€€" | "€€€";
  is_open: boolean;
  hours_summary: string | null;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  menu_url: string | null;
  google_maps_url: string | null;
  waze_url: string | null;
  localfood_match_score: number;
  is_new: boolean;
  is_active: boolean;
  tags: SupabaseRestaurantTag[];
  badges: SupabaseRestaurantBadge[];
  photos: SupabaseRestaurantPhoto[];
  opening_hours: SupabaseRestaurantOpeningHour[];
  offers: SupabaseRestaurantOffer[];
};

type MaybeArray<T> = T | T[] | null;

type SupabaseRestaurantRow = Omit<
  SupabaseRestaurantListItem,
  "tags" | "badges" | "photos" | "opening_hours" | "offers"
> & {
  restaurant_tags:
    | {
        tags: MaybeArray<SupabaseRestaurantTag>;
      }[]
    | null;
  restaurant_badges:
    | {
        badges: MaybeArray<SupabaseRestaurantBadge>;
      }[]
    | null;
  restaurant_photos: SupabaseRestaurantPhoto[] | null;
  restaurant_opening_hours: SupabaseRestaurantOpeningHour[] | null;
  restaurant_offers: SupabaseRestaurantOffer[] | null;
};

function toArray<T>(value: MaybeArray<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeRestaurant(row: SupabaseRestaurantRow): SupabaseRestaurantListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    cuisine_type: row.cuisine_type,
    description: row.description,
    main_image_url: row.main_image_url,
    rating: Number(row.rating),
    reviews_count: row.reviews_count,
    distance_km: row.distance_km === null ? null : Number(row.distance_km),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    price_level: row.price_level,
    price_label: row.price_label,
    is_open: row.is_open,
    hours_summary: row.hours_summary,
    address: row.address,
    city: row.city,
    country: row.country,
    phone: row.phone,
    menu_url: row.menu_url,
    google_maps_url: row.google_maps_url,
    waze_url: row.waze_url,
    localfood_match_score: row.localfood_match_score,
    is_new: row.is_new,
    is_active: row.is_active,
    tags: row.restaurant_tags?.flatMap((item) => toArray(item.tags)) ?? [],
    badges: row.restaurant_badges?.flatMap((item) => toArray(item.badges)) ?? [],
    photos: row.restaurant_photos ?? [],
    opening_hours: row.restaurant_opening_hours ?? [],
    offers: row.restaurant_offers?.filter((offer) => offer.is_active) ?? [],
  };
}

export async function fetchSupabaseRestaurants() {
  const data = await fetchJsonData<SupabaseRestaurantRow[]>(`${apiBaseUrl}/api/public/restaurants`);

  return data.map(normalizeRestaurant);
}

export async function fetchSupabaseRestaurantBySlug(slug: string) {
  try {
    const data = await fetchJsonData<SupabaseRestaurantRow>(
      `${apiBaseUrl}/api/public/restaurants/${encodeURIComponent(slug)}`,
    );

    return normalizeRestaurant(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Restaurant introuvable.") {
      return null;
    }

    throw error;
  }
}

export async function fetchSupabaseRestaurantById(restaurantId: string) {
  try {
    const data = await fetchJsonData<SupabaseRestaurantRow>(
      `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}`,
      {
        headers: await getAuthHeaders(),
      },
    );

    return normalizeRestaurant(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Restaurant introuvable.") {
      return null;
    }

    throw error;
  }
}

export type SupabaseRestaurantReview = {
  id: string;
  restaurant_id: string;
  author_name: string;
  rating: number;
  comment: string;
  photo_url: string | null;
  status: "published" | "pending" | "hidden";
  created_at: string;
  updated_at: string;
};

export type SupabaseRestaurantReviewStatus = SupabaseRestaurantReview["status"];

export async function updateOwnedRestaurantReviewStatus({
  reviewId,
  status,
}: {
  reviewId: string;
  status: SupabaseRestaurantReviewStatus;
}) {
  return fetchJsonData<
    {
      id: string;
      status: SupabaseRestaurantReviewStatus;
      updated_at: string;
    }[]
  >(`${apiBaseUrl}/api/admin/restaurants/reviews/${encodeURIComponent(reviewId)}/status`, {
    method: "PATCH",
    headers: {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function fetchSupabaseRestaurantReviewsBySlug(slug: string) {
  return fetchJsonData<SupabaseRestaurantReview[]>(
    `${apiBaseUrl}/api/public/restaurants/${encodeURIComponent(slug)}/reviews`,
  );
}

export async function fetchSupabaseRestaurantReviewsByRestaurantId(restaurantId: string) {
  return fetchJsonData<SupabaseRestaurantReview[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/reviews`,
    {
      headers: await getAuthHeaders(),
    },
  );
}

export type SupabaseRestaurantInteractionType =
  | "Maps"
  | "Waze"
  | "Appel"
  | "Menu"
  | "Intent"
  | "AI"
  | "Avis"
  | "Offre"
  | "Vue";

export type SupabaseRestaurantInteraction = {
  id: string;
  restaurant_id: string;
  action: string;
  source: string;
  interaction_type: SupabaseRestaurantInteractionType;
  created_at: string;
};

export async function fetchSupabaseRestaurantInteractionsBySlug(slug: string) {
  return fetchJsonData<SupabaseRestaurantInteraction[]>(
    `${apiBaseUrl}/api/admin/restaurants/by-slug/${encodeURIComponent(slug)}/interactions`,
    {
      headers: await getAuthHeaders(),
    },
  );
}

export type SupabaseRestaurantInteractionSource =
  | "public_card"
  | "public_detail"
  | "ai_assistant"
  | "dashboard_seed";

export async function trackRestaurantInteractionBySlug({
  slug,
  action,
  source,
  interactionType,
}: {
  slug: string;
  action: string;
  source: SupabaseRestaurantInteractionSource;
  interactionType: SupabaseRestaurantInteractionType;
}) {
  const url = `${apiBaseUrl}/api/public/restaurants/${encodeURIComponent(slug)}/interactions`;

  await fetchJsonData<null>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      source,
      interactionType,
    }),
  });
}

export async function updateOwnedRestaurantTags({
  restaurantId,
  tagSlugs,
}: {
  restaurantId: string;
  tagSlugs: string[];
}) {
  const data = await fetchJsonData<{
    restaurant_id: string;
    tag_count: number;
  }>(`${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/tags`, {
    method: "PUT",
    headers: {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tagSlugs }),
  });

  return [data];
}

export type UpdateOwnedRestaurantPayload = {
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
  isActive: boolean;
  hoursSummary: string;
  menuUrl: string;
  googleMapsUrl: string;
  wazeUrl: string;
};

export async function updateOwnedRestaurant(payload: UpdateOwnedRestaurantPayload) {
  return fetchJsonData<{ id: string }>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(payload.restaurantId)}`,
    {
      method: "PATCH",
      headers: {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        category: payload.category,
        cuisineType: payload.cuisineType,
        description: payload.description,
        priceLabel: payload.priceLabel,
        isOpen: payload.isOpen,
        address: payload.address,
        city: payload.city,
        country: payload.country,
        phone: payload.phone,
        isActive: payload.isActive,
        hoursSummary: payload.hoursSummary,
        menuUrl: payload.menuUrl,
        googleMapsUrl: payload.googleMapsUrl,
        wazeUrl: payload.wazeUrl,
      }),
    },
  );
}

export async function uploadRestaurantPhotoFile({
  restaurantId,
  file,
}: {
  restaurantId: string;
  file: File;
}) {
  const formData = new FormData();

  formData.append("restaurantId", restaurantId);
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/api/admin/restaurant-photos/upload`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData,
  });

  const json = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: {
      publicUrl: string;
      storagePath: string;
    };
    error?: string;
    message?: string;
  } | null;

  if (!response.ok || !json?.ok || !json.data) {
    throw new Error(json?.error ?? json?.message ?? "Impossible d’envoyer la photo.");
  }

  return json.data.publicUrl;
}

export async function addOwnedRestaurantPhoto({
  restaurantId,
  url,
  category,
}: {
  restaurantId: string;
  url: string;
  category: string;
}) {
  return fetchJsonData<SupabaseRestaurantPhoto[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/photos`,
    {
      method: "POST",
      headers: {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        category,
      }),
    },
  );
}

export async function deleteOwnedRestaurantPhoto(photoId: string) {
  const response = await fetch(`${apiBaseUrl}/api/admin/restaurant-photos/${photoId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error ?? "Impossible de supprimer la photo.");
  }

  return json.data as {
    photoId: string;
    storageDeleted: boolean;
    storagePath: string | null;
  };
}

export type SupabaseCompanyRestaurant = {
  id: string;
  name: string;
  slug: string;
  company_id: string | null;
  is_active: boolean;
};

export async function fetchSupabaseRestaurantsByCompanyId(companyId: string) {
  return fetchJsonData<SupabaseCompanyRestaurant[]>(
    `${apiBaseUrl}/api/admin/restaurants/company/${encodeURIComponent(companyId)}`,
    {
      headers: await getAuthHeaders(),
    },
  );
}

export type OwnedRestaurantOffer = {
  id: string;
  restaurant_id: string;
  code: string;
  title: string;
  description: string;
  conditions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchOwnedRestaurantOffers(restaurantId: string) {
  return fetchJsonData<OwnedRestaurantOffer[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/offers`,
    {
      headers: await getAuthHeaders(),
    },
  );
}

export async function upsertOwnedRestaurantOffer({
  offerId,
  restaurantId,
  code,
  title,
  description,
  conditions,
  isActive,
}: {
  offerId: string | null;
  restaurantId: string;
  code: string;
  title: string;
  description: string;
  conditions: string;
  isActive: boolean;
}) {
  return fetchJsonData<OwnedRestaurantOffer[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/offers`,
    {
      method: "POST",
      headers: {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerId,
        code,
        title,
        description,
        conditions,
        isActive,
      }),
    },
  );
}

export async function updateOwnedRestaurantOfferStatus({
  offerId,
  isActive,
}: {
  offerId: string;
  isActive: boolean;
}) {
  return fetchJsonData<
    {
      id: string;
      restaurant_id: string;
      is_active: boolean;
      updated_at: string;
    }[]
  >(`${apiBaseUrl}/api/admin/restaurants/offers/${encodeURIComponent(offerId)}/status`, {
    method: "PATCH",
    headers: {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });
}

export type OwnedRestaurantOpeningHour = {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  day_label: string;
  hours_text: string;
  is_closed: boolean;
  created_at: string;
};

export type OwnedRestaurantOpeningHourInput = {
  day_of_week: number;
  day_label: string;
  hours_text: string;
  is_closed: boolean;
};

export async function fetchOwnedRestaurantOpeningHours(restaurantId: string) {
  return fetchJsonData<OwnedRestaurantOpeningHour[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/opening-hours`,
    {
      headers: await getAuthHeaders(),
    },
  );
}

export async function upsertOwnedRestaurantOpeningHours({
  restaurantId,
  hours,
}: {
  restaurantId: string;
  hours: OwnedRestaurantOpeningHourInput[];
}) {
  return fetchJsonData<OwnedRestaurantOpeningHour[]>(
    `${apiBaseUrl}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/opening-hours`,
    {
      method: "PUT",
      headers: {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hours }),
    },
  );
}
