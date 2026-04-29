import { supabase } from "@/lib/supabase";

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
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `
        id,
        name,
        slug,
        category,
        cuisine_type,
        description,
        main_image_url,
        rating,
        reviews_count,
        distance_km,
        latitude,
        longitude,
        price_level,
        price_label,
        is_open,
        hours_summary,
        address,
        city,
        country,
        phone,
        menu_url,
        google_maps_url,
        waze_url,
        localfood_match_score,
        is_new,
        is_active,
        restaurant_tags (
          tags (
            label,
            slug
          )
        ),
        restaurant_badges (
          badges (
            label,
            slug
          )
        ),
        restaurant_photos (
          id,
          url,
          category,
          is_client_photo,
          author_name,
          sort_order
        ),
        restaurant_opening_hours (
          id,
          day_of_week,
          day_label,
          hours_text,
          is_closed
        ),
        restaurant_offers (
          id,
          code,
          title,
          description,
          conditions,
          is_active
        )
      `,
    )
    .eq("is_active", true)
    .order("reviews_count", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as unknown as SupabaseRestaurantRow[]).map(normalizeRestaurant);
}

export async function fetchSupabaseRestaurantBySlug(slug: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `
        id,
        name,
        slug,
        category,
        cuisine_type,
        description,
        main_image_url,
        rating,
        reviews_count,
        distance_km,
        latitude,
        longitude,
        price_level,
        price_label,
        is_open,
        hours_summary,
        address,
        city,
        country,
        phone,
        menu_url,
        google_maps_url,
        waze_url,
        localfood_match_score,
        is_new,
        is_active,
        restaurant_tags (
          tags (
            label,
            slug
          )
        ),
        restaurant_badges (
          badges (
            label,
            slug
          )
        ),
        restaurant_photos (
          id,
          url,
          category,
          is_client_photo,
          author_name,
          sort_order
        ),
        restaurant_opening_hours (
          id,
          day_of_week,
          day_label,
          hours_text,
          is_closed
        ),
        restaurant_offers (
          id,
          code,
          title,
          description,
          conditions,
          is_active
        )
      `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizeRestaurant(data as unknown as SupabaseRestaurantRow);
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

export async function fetchSupabaseRestaurantReviewsBySlug(slug: string) {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (restaurantError) {
    throw restaurantError;
  }

  if (!restaurant) {
    return [];
  }

  const { data, error } = await supabase
    .from("restaurant_reviews")
    .select(
      `
        id,
        restaurant_id,
        author_name,
        rating,
        comment,
        photo_url,
        status,
        created_at,
        updated_at
      `,
    )
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseRestaurantReview[];
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
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (restaurantError) {
    throw restaurantError;
  }

  if (!restaurant) {
    return [];
  }

  const { data, error } = await supabase
    .from("restaurant_interactions")
    .select(
      `
        id,
        restaurant_id,
        action,
        source,
        interaction_type,
        created_at
      `,
    )
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseRestaurantInteraction[];
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
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (restaurantError) {
    throw restaurantError;
  }

  if (!restaurant) {
    return;
  }

  const { error } = await supabase.from("restaurant_interactions").insert({
    restaurant_id: restaurant.id,
    action,
    source,
    interaction_type: interactionType,
  });

  if (error) {
    throw error;
  }
}
