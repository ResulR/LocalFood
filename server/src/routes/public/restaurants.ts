import { Router } from "express";
import { z } from "zod";
import { dbQuery } from "../../lib/db.js";

export const publicRestaurantsRouter = Router();

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
        tags: RelatedLabel;
      }[]
    | null;
  restaurant_badges:
    | {
        badges: RelatedLabel;
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

type RestaurantReviewRow = {
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

const interactionSchema = z.object({
  action: z.string().trim().min(1).max(160),
  source: z.enum(["public_card", "public_detail", "ai_assistant", "dashboard_seed"]),
  interactionType: z.enum([
    "Maps",
    "Waze",
    "Appel",
    "Menu",
    "Intent",
    "AI",
    "Avis",
    "Offre",
    "Vue",
  ]),
});

async function fetchActiveRestaurants() {
  const result = await dbQuery<RestaurantRow>(
    `
      select
        r.id,
        r.name,
        r.slug,
        r.category,
        r.cuisine_type,
        r.description,
        r.main_image_url,
        r.rating,
        r.reviews_count,
        r.distance_km,
        r.latitude,
        r.longitude,
        r.price_level,
        r.price_label,
        r.is_open,
        r.hours_summary,
        r.address,
        r.city,
        r.country,
        r.phone,
        r.menu_url,
        r.google_maps_url,
        r.waze_url,
        r.localfood_match_score,
        r.is_new,
        r.is_active,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'tags',
                json_build_object(
                  'label', t.label,
                  'slug', t.slug
                )
              )
              order by t.sort_order asc, t.label asc
            )
            from public.restaurant_tags rt
            join public.tags t on t.id = rt.tag_id
            where rt.restaurant_id = r.id
              and t.is_active = true
          ),
          '[]'::json
        ) as restaurant_tags,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'badges',
                json_build_object(
                  'label', b.label,
                  'slug', b.slug
                )
              )
              order by b.sort_order asc, b.label asc
            )
            from public.restaurant_badges rb
            join public.badges b on b.id = rb.badge_id
            where rb.restaurant_id = r.id
              and b.is_active = true
          ),
          '[]'::json
        ) as restaurant_badges,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'id', rp.id,
                'url', rp.url,
                'category', rp.category,
                'is_client_photo', rp.is_client_photo,
                'author_name', rp.author_name,
                'sort_order', rp.sort_order
              )
              order by rp.sort_order asc, rp.created_at asc
            )
            from public.restaurant_photos rp
            where rp.restaurant_id = r.id
          ),
          '[]'::json
        ) as restaurant_photos,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'id', roh.id,
                'day_of_week', roh.day_of_week,
                'day_label', roh.day_label,
                'hours_text', roh.hours_text,
                'is_closed', roh.is_closed
              )
              order by roh.day_of_week asc
            )
            from public.restaurant_opening_hours roh
            where roh.restaurant_id = r.id
          ),
          '[]'::json
        ) as restaurant_opening_hours,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'id', ro.id,
                'code', ro.code,
                'title', ro.title,
                'description', ro.description,
                'conditions', ro.conditions,
                'is_active', ro.is_active
              )
              order by ro.created_at desc
            )
            from public.restaurant_offers ro
            where ro.restaurant_id = r.id
              and ro.is_active = true
          ),
          '[]'::json
        ) as restaurant_offers
      from public.restaurants r
      where r.is_active = true
      order by r.reviews_count desc
    `,
  );

  return result.rows;
}

async function fetchActiveRestaurantBySlug(slug: string) {
  const result = await dbQuery<RestaurantRow>(
    `
      select *
      from (
        select
          r.id,
          r.name,
          r.slug,
          r.category,
          r.cuisine_type,
          r.description,
          r.main_image_url,
          r.rating,
          r.reviews_count,
          r.distance_km,
          r.latitude,
          r.longitude,
          r.price_level,
          r.price_label,
          r.is_open,
          r.hours_summary,
          r.address,
          r.city,
          r.country,
          r.phone,
          r.menu_url,
          r.google_maps_url,
          r.waze_url,
          r.localfood_match_score,
          r.is_new,
          r.is_active,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'tags',
                  json_build_object(
                    'label', t.label,
                    'slug', t.slug
                  )
                )
                order by t.sort_order asc, t.label asc
              )
              from public.restaurant_tags rt
              join public.tags t on t.id = rt.tag_id
              where rt.restaurant_id = r.id
                and t.is_active = true
            ),
            '[]'::json
          ) as restaurant_tags,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'badges',
                  json_build_object(
                    'label', b.label,
                    'slug', b.slug
                  )
                )
                order by b.sort_order asc, b.label asc
              )
              from public.restaurant_badges rb
              join public.badges b on b.id = rb.badge_id
              where rb.restaurant_id = r.id
                and b.is_active = true
            ),
            '[]'::json
          ) as restaurant_badges,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'id', rp.id,
                  'url', rp.url,
                  'category', rp.category,
                  'is_client_photo', rp.is_client_photo,
                  'author_name', rp.author_name,
                  'sort_order', rp.sort_order
                )
                order by rp.sort_order asc, rp.created_at asc
              )
              from public.restaurant_photos rp
              where rp.restaurant_id = r.id
            ),
            '[]'::json
          ) as restaurant_photos,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'id', roh.id,
                  'day_of_week', roh.day_of_week,
                  'day_label', roh.day_label,
                  'hours_text', roh.hours_text,
                  'is_closed', roh.is_closed
                )
                order by roh.day_of_week asc
              )
              from public.restaurant_opening_hours roh
              where roh.restaurant_id = r.id
            ),
            '[]'::json
          ) as restaurant_opening_hours,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'id', ro.id,
                  'code', ro.code,
                  'title', ro.title,
                  'description', ro.description,
                  'conditions', ro.conditions,
                  'is_active', ro.is_active
                )
                order by ro.created_at desc
              )
              from public.restaurant_offers ro
              where ro.restaurant_id = r.id
                and ro.is_active = true
            ),
            '[]'::json
          ) as restaurant_offers
        from public.restaurants r
        where r.slug = $1
          and r.is_active = true
      ) restaurant
      limit 1
    `,
    [slug],
  );

  return result.rows[0] ?? null;
}

publicRestaurantsRouter.get("/", async (_request, response, next) => {
  try {
    const restaurants = await fetchActiveRestaurants();

    response.json({
      ok: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
});

publicRestaurantsRouter.get("/:slug/reviews", async (request, response, next) => {
  try {
    const restaurant = await dbQuery<{ id: string }>(
      `
        select id
        from public.restaurants
        where slug = $1
          and is_active = true
        limit 1
      `,
      [request.params.slug],
    );

    const restaurantId = restaurant.rows[0]?.id;

    if (!restaurantId) {
      response.json({
        ok: true,
        data: [],
      });
      return;
    }

    const reviews = await dbQuery<RestaurantReviewRow>(
      `
        select
          id,
          restaurant_id,
          author_name,
          rating,
          comment,
          photo_url,
          status,
          created_at,
          updated_at
        from public.restaurant_reviews
        where restaurant_id = $1
          and status = 'published'
        order by created_at desc
      `,
      [restaurantId],
    );

    response.json({
      ok: true,
      data: reviews.rows,
    });
  } catch (error) {
    next(error);
  }
});

publicRestaurantsRouter.post("/:slug/interactions", async (request, response, next) => {
  try {
    const payload = interactionSchema.parse(request.body);

    const restaurant = await dbQuery<{ id: string }>(
      `
        select id
        from public.restaurants
        where slug = $1
          and is_active = true
        limit 1
      `,
      [request.params.slug],
    );

    const restaurantId = restaurant.rows[0]?.id;

    if (!restaurantId) {
      response.status(404).json({
        ok: false,
        code: "RESTAURANT_NOT_FOUND",
        message: "Restaurant introuvable.",
      });
      return;
    }

    await dbQuery(
      `
        insert into public.restaurant_interactions (
          restaurant_id,
          action,
          source,
          interaction_type
        )
        values ($1, $2, $3, $4)
      `,
      [restaurantId, payload.action, payload.source, payload.interactionType],
    );

    response.status(201).json({
      ok: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({
        ok: false,
        code: "INVALID_INTERACTION_PAYLOAD",
        message: "Interaction invalide.",
        issues: error.flatten(),
      });
      return;
    }

    next(error);
  }
});

publicRestaurantsRouter.get("/:slug", async (request, response, next) => {
  try {
    const restaurant = await fetchActiveRestaurantBySlug(request.params.slug);

    if (!restaurant) {
      response.status(404).json({
        ok: false,
        code: "RESTAURANT_NOT_FOUND",
        message: "Restaurant introuvable.",
      });
      return;
    }

    response.json({
      ok: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
});
