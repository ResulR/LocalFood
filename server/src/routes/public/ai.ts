import OpenAI from "openai";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { createSupabaseAdminClient } from "../../lib/supabase-server.js";

export const publicAiRouter = Router();

const DAILY_REQUEST_LIMIT = env.AI_DAILY_REQUEST_LIMIT;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requestCountsByIp = new Map<string, RateLimitEntry>();

const LOCALFOOD_TOPIC_TERMS = [
  "restaurant",
  "resto",
  "manger",
  "food",
  "snack",
  "brunch",
  "dessert",
  "halal",
  "vegan",
  "terrasse",
  "parking",
  "livraison",
  "emporter",
  "menu",
  "ouvert",
  "ferme",
  "date night",
  "pas cher",
  "sushi",
  "pizza",
  "burger",
  "pates",
  "pasta",
  "cuisine",
  "adresse",
  "itineraire",
  "maps",
  "waze",
];

function isLocalFoodRelated(message: string, activeTags: RelatedLabel[]) {
  const normalizedMessage = normalizeText(message).replace(/-/g, " ");

  const tagTerms = activeTags.flatMap((tag) => buildTagSearchTerms(tag));

  return [...LOCALFOOD_TOPIC_TERMS, ...tagTerms].some((term) =>
    normalizedMessage.includes(normalizeText(term).replace(/-/g, " ")),
  );
}

function createOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

type AiRecommendation = {
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
  tags: RelatedLabel[];
  badges: RelatedLabel[];
  offer:
    | {
        id: string;
        code: string;
        title: string;
        description: string;
        conditions: string | null;
        is_active: boolean;
      }
    | null;
  matchScore: number;
  matchReasons: string[];
};

async function generateAiAnswer({
  message,
  recommendations,
  detectedIntents,
}: {
  message: string;
  recommendations: AiRecommendation[];
  detectedIntents: DetectedIntent[];
}) {
  const fallbackAnswer =
    recommendations.length > 0
      ? `J'ai trouvé ${recommendations.length} restaurant(s) qui correspondent à votre recherche.`
      : "Je n'ai pas trouvé de restaurant actif qui correspond clairement à cette recherche pour le moment.";

  const client = createOpenAIClient();

  if (!client) {
    return fallbackAnswer;
  }

  const compactRestaurants = recommendations.map((restaurant) => ({
    name: restaurant.name,
    category: restaurant.category,
    cuisineType: restaurant.cuisineType,
    city: restaurant.city,
    rating: restaurant.rating,
    reviewsCount: restaurant.reviewsCount,
    priceLabel: restaurant.priceLabel,
    isOpen: restaurant.isOpen,
    hoursSummary: restaurant.hoursSummary,
    tags: restaurant.tags.map((tag) => tag.label),
    badges: restaurant.badges.map((badge) => badge.label),
    offer: restaurant.offer
      ? {
          title: restaurant.offer.title,
          description: restaurant.offer.description,
          code: restaurant.offer.code,
        }
      : null,
    matchScore: restaurant.matchScore,
    matchReasons: restaurant.matchReasons,
  }));

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      instructions:
        "Tu es l'assistant LocalFood. Réponds uniquement avec les restaurants fournis dans le contexte. Ne crée jamais de restaurant, d'adresse, d'offre, de note ou de donnée non fournie. Réponds en français, de façon courte, utile et naturelle. Si aucun restaurant n'est fourni, explique simplement qu'aucun restaurant actif ne correspond clairement pour le moment. Ne parle pas de base de données, d'algorithme ou de scoring interne.",
      input: JSON.stringify({
        userRequest: message,
        detectedCriteria: detectedIntents.map((intent) => intent.label),
        restaurants: compactRestaurants,
      }),
      max_output_tokens: 220,
    });

    return response.output_text?.trim() || fallbackAnswer;
  } catch (error) {
    console.error("OpenAI LocalFood answer generation failed:", error);
    return fallbackAnswer;
  }
}

const restaurantSearchSchema = z.object({
  message: z.string().trim().min(2).max(500),
  userLocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

type MaybeArray<T> = T | T[] | null;

type RelatedLabel = {
  label: string;
  slug: string;
};

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine_type: string;
  description: string;
  main_image_url: string | null;
  rating: number | string;
  reviews_count: number;
  distance_km: number | string | null;
  latitude: number | string | null;
  longitude: number | string | null;
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
  restaurant_tags:
    | {
        tags: MaybeArray<RelatedLabel>;
      }[]
    | null;
  restaurant_badges:
    | {
        badges: MaybeArray<RelatedLabel>;
      }[]
    | null;
  restaurant_photos:
    | {
        id: string;
        url: string;
        category: string;
        is_client_photo: boolean;
        author_name: string | null;
        sort_order: number;
      }[]
    | null;
  restaurant_opening_hours:
    | {
        id: string;
        day_of_week: number;
        day_label: string;
        hours_text: string;
        is_closed: boolean;
      }[]
    | null;
  restaurant_offers:
    | {
        id: string;
        code: string;
        title: string;
        description: string;
        conditions: string | null;
        is_active: boolean;
      }[]
    | null;
};

type DetectedIntent = RelatedLabel;

function toArray<T>(value: MaybeArray<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9€\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getClientIp(req: { headers: Record<string, unknown>; ip?: string }) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }

  return req.ip || "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = requestCountsByIp.get(ip);

  if (!current || current.resetAt <= now) {
    requestCountsByIp.set(ip, {
      count: 1,
      resetAt: now + DAY_IN_MS,
    });

    return {
      allowed: true,
      remaining: DAILY_REQUEST_LIMIT - 1,
      resetAt: now + DAY_IN_MS,
    };
  }

  if (current.count >= DAILY_REQUEST_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  requestCountsByIp.set(ip, current);

  return {
    allowed: true,
    remaining: DAILY_REQUEST_LIMIT - current.count,
    resetAt: current.resetAt,
  };
}

function buildTagSearchTerms(tag: RelatedLabel) {
  return Array.from(
    new Set(
      [tag.label, tag.slug, tag.slug.replace(/-/g, " "), tag.label.replace(/-/g, " ")]
        .map((value) => normalizeText(value).replace(/-/g, " "))
        .filter((value) => value.length >= 2),
    ),
  );
}

function detectIntents(message: string, activeTags: RelatedLabel[]) {
  const normalizedMessage = normalizeText(message).replace(/-/g, " ");

  return activeTags.filter((tag) =>
    buildTagSearchTerms(tag).some((term) => normalizedMessage.includes(term)),
  );
}

function getRestaurantTags(row: RestaurantRow) {
  return row.restaurant_tags?.flatMap((item) => toArray(item.tags)) ?? [];
}

function getRestaurantBadges(row: RestaurantRow) {
  return row.restaurant_badges?.flatMap((item) => toArray(item.badges)) ?? [];
}

function getActiveOffers(row: RestaurantRow) {
  return row.restaurant_offers?.filter((offer) => offer.is_active) ?? [];
}

function scoreRestaurant(row: RestaurantRow, message: string, detectedIntents: DetectedIntent[]) {
  const normalizedMessage = normalizeText(message);
  const tags = getRestaurantTags(row);
  const badges = getRestaurantBadges(row);
  const activeOffers = getActiveOffers(row);

  const tagLabels = tags.map((tag) => normalizeText(tag.label));
  const tagSlugs = tags.map((tag) => normalizeText(tag.slug));
  const badgeLabels = badges.map((badge) => normalizeText(badge.label));

  const searchableText = normalizeText(
    [
      row.name,
      row.category,
      row.cuisine_type,
      row.description,
      row.city,
      row.hours_summary ?? "",
      tags.map((tag) => tag.label).join(" "),
      badges.map((badge) => badge.label).join(" "),
      activeOffers.map((offer) => `${offer.title} ${offer.description} ${offer.code}`).join(" "),
    ].join(" "),
  );

  let score = Math.min(15, Math.max(0, Number(row.localfood_match_score) / 8));
  let intentMatchCount = 0;
  const reasons: string[] = [];

  for (const intent of detectedIntents) {
    const normalizedIntentLabel = normalizeText(intent.label);
    const normalizedIntentSlug = normalizeText(intent.slug);

    if (tagLabels.includes(normalizedIntentLabel) || tagSlugs.includes(normalizedIntentSlug)) {
      score += 25;
      intentMatchCount += 1;
      reasons.push(`correspond au critère ${intent.label}`);
    }
  }

  const importantWords = normalizedMessage
    .split(" ")
    .filter((word) => word.length >= 4)
    .slice(0, 12);

  const matchedWords = importantWords.filter((word) => searchableText.includes(word));

  if (matchedWords.length > 0) {
    score += Math.min(20, matchedWords.length * 4);
    reasons.push("sa fiche correspond aux mots-clés de votre recherche");
  }

  if (Number(row.rating) >= 4.3) {
    score += 5;
    reasons.push("bonne note client");
  }

  if (row.reviews_count >= 50) {
    score += 5;
  }

  if (badgeLabels.includes("populaire") || badgeLabels.includes("recommande")) {
    score += 3;
  }

  return {
    score: Math.min(100, Math.round(score)),
    intentMatchCount,
    reasons: Array.from(new Set(reasons)).slice(0, 3),
  };
}

publicAiRouter.post("/restaurant-search", async (req, res) => {
  const parsed = restaurantSearchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      code: "INVALID_AI_SEARCH_PAYLOAD",
      message: "Requête invalide.",
      issues: parsed.error.flatten(),
    });
  }

  let supabaseAdmin;

  try {
    supabaseAdmin = createSupabaseAdminClient();
  } catch {
    return res.status(503).json({
      ok: false,
      code: "SERVER_SUPABASE_NOT_CONFIGURED",
      message: "Supabase n'est pas configuré côté serveur.",
    });
  }

  const { message } = parsed.data;

  const { data: activeTagsData, error: activeTagsError } = await supabaseAdmin
    .from("tags")
    .select("label, slug")
    .eq("is_active", true);

  if (activeTagsError) {
    return res.status(500).json({
      ok: false,
      code: "AI_TAGS_QUERY_FAILED",
      message: "Impossible de charger les tags LocalFood.",
    });
  }

  const activeTags = (activeTagsData ?? []) as RelatedLabel[];

  if (!isLocalFoodRelated(message, activeTags)) {
    return res.json({
      ok: true,
      data: {
        answer:
          "Je peux uniquement vous aider à trouver un restaurant LocalFood selon vos envies : halal, terrasse, brunch, parking, dessert, ouvert maintenant, livraison, à emporter, etc.",
        detectedTags: [],
        recommendations: [],
      },
    });
  }

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);

  res.setHeader("X-RateLimit-Limit", String(DAILY_REQUEST_LIMIT));
  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  res.setHeader("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());

  if (!rateLimit.allowed) {
    return res.status(429).json({
      ok: false,
      code: "AI_RATE_LIMIT_EXCEEDED",
      message: "Limite quotidienne atteinte pour l'assistant LocalFood.",
    });
  }

  const detectedIntents = detectIntents(message, activeTags);

  const { data, error } = await supabaseAdmin
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
    return res.status(500).json({
      ok: false,
      code: "AI_RESTAURANTS_QUERY_FAILED",
      message: "Impossible de charger les restaurants LocalFood.",
    });
  }

  const rows = (data ?? []) as unknown as RestaurantRow[];

  const recommendations = rows
    .map((row) => {
      const tags = getRestaurantTags(row);
      const badges = getRestaurantBadges(row);
      const activeOffers = getActiveOffers(row);
      const scoring = scoreRestaurant(row, message, detectedIntents);
      const photos = row.restaurant_photos ?? [];
      const sortedPhotos = photos.slice().sort((a, b) => a.sort_order - b.sort_order);
      const imageUrl = row.main_image_url ?? sortedPhotos[0]?.url ?? null;

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        cuisineType: row.cuisine_type,
        description: row.description,
        imageUrl,
        rating: Number(row.rating),
        reviewsCount: row.reviews_count,
        priceLabel: row.price_label,
        isOpen: row.is_open,
        hoursSummary: row.hours_summary,
        address: row.address,
        city: row.city,
        phone: row.phone,
        menuUrl: row.menu_url,
        googleMapsUrl: row.google_maps_url,
        wazeUrl: row.waze_url,
        tags,
        badges,
        offer: activeOffers[0] ?? null,
        matchScore: scoring.score,
        intentMatchCount: scoring.intentMatchCount,
        matchReasons:
          scoring.reasons.length > 0
            ? scoring.reasons
            : ["restaurant actif dans la base LocalFood"],
      };
    })
    .filter((restaurant) => {
      if (detectedIntents.length === 0) {
        return restaurant.matchScore >= 35;
      }

      return restaurant.intentMatchCount >= detectedIntents.length;
    })
    .map(({ intentMatchCount, ...restaurant }) => restaurant)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const answer = await generateAiAnswer({
    message,
    recommendations,
    detectedIntents,
  });

  return res.json({
    ok: true,
    data: {
      answer,
      detectedTags: detectedIntents.map((intent) => ({
        label: intent.label,
        slug: intent.slug,
      })),
      recommendations,
    },
  });
});
