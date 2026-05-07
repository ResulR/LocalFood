import { Router } from "express";
import { z } from "zod";
import { dbQuery } from "../../lib/db.js";
import { requireAuth } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminRestaurantsRouter = Router();

type CompanyRestaurantRow = {
  id: string;
  name: string;
  slug: string;
  company_id: string | null;
  is_active: boolean;
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
  restaurant_tags: {
    tags: {
      label: string;
      slug: string;
    };
  }[];
  restaurant_badges: {
    badges: {
      label: string;
      slug: string;
    };
  }[];
  restaurant_photos: {
    id: string;
    url: string;
    category: string;
    is_client_photo: boolean;
    author_name: string | null;
    sort_order: number;
  }[];
  restaurant_opening_hours: {
    id: string;
    day_of_week: number;
    day_label: string;
    hours_text: string;
    is_closed: boolean;
  }[];
  restaurant_offers: {
    id: string;
    code: string;
    title: string;
    description: string;
    conditions: string | null;
    is_active: boolean;
  }[];
};

const companyParamsSchema = z.object({
  companyId: z.string().uuid(),
});

const restaurantParamsSchema = z.object({
  restaurantId: z.string().uuid(),
});

const reviewParamsSchema = z.object({
  reviewId: z.string().uuid(),
});

const updateReviewStatusSchema = z.object({
  status: z.enum(["published", "pending", "hidden"]),
});

const updateRestaurantSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(120),
  cuisineType: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1200),
  priceLabel: z.enum(["€", "€€", "€€€"]),
  isOpen: z.boolean(),
  address: z.string().trim().min(1).max(240),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(80),
  isActive: z.boolean(),
  hoursSummary: z.string().trim().max(160),
  menuUrl: z.string().trim().max(500),
  googleMapsUrl: z.string().trim().max(500),
  wazeUrl: z.string().trim().max(500),
});

const updateTagsSchema = z.object({
  tagSlugs: z.array(z.string().trim().min(1).max(80)).default([]),
});

async function assertCanAccessCompany(userId: string, role: string | null, companyId: string) {
  if (role === "superadmin") {
    return;
  }

  if (role !== "admin" && role !== "user") {
    throw new HttpError(403, "Not allowed.", "COMPANY_ACCESS_FORBIDDEN");
  }

  const membership = await dbQuery<{ id: string }>(
    `
      select id
      from public.company_users
      where user_id = $1
        and company_id = $2
      limit 1
    `,
    [userId, companyId],
  );

  if (!membership.rows[0]) {
    throw new HttpError(403, "Not allowed for this company.", "COMPANY_ACCESS_FORBIDDEN");
  }
}

async function fetchRestaurantCompanyId(restaurantId: string) {
  const result = await dbQuery<{ company_id: string | null }>(
    `
      select company_id
      from public.restaurants
      where id = $1
      limit 1
    `,
    [restaurantId],
  );

  return result.rows[0]?.company_id ?? null;
}

async function assertCanAccessRestaurant(
  userId: string,
  role: string | null,
  restaurantId: string,
) {
  const companyId = await fetchRestaurantCompanyId(restaurantId);

  if (!companyId) {
    throw new HttpError(
      400,
      "Restaurant is not linked to a company.",
      "RESTAURANT_COMPANY_MISSING",
    );
  }

  await assertCanAccessCompany(userId, role, companyId);
}

async function fetchRestaurantById(restaurantId: string) {
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
          ),
          '[]'::json
        ) as restaurant_offers
      from public.restaurants r
      where r.id = $1
      limit 1
    `,
    [restaurantId],
  );

  return result.rows[0] ?? null;
}

adminRestaurantsRouter.patch(
  "/reviews/:reviewId/status",
  requireAuth,
  async (request, response, next) => {
    try {
      const { reviewId } = reviewParamsSchema.parse(request.params);
      const payload = updateReviewStatusSchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      if (request.auth.role !== "superadmin") {
        throw new HttpError(
          403,
          "Only SuperAdmins can moderate reviews.",
          "REVIEW_MODERATION_FORBIDDEN",
        );
      }

      const reviewRestaurantResult = await dbQuery<{ restaurant_id: string }>(
        `
        select restaurant_id
        from public.restaurant_reviews
        where id = $1
        limit 1
      `,
        [reviewId],
      );

      const restaurantId = reviewRestaurantResult.rows[0]?.restaurant_id;

      if (!restaurantId) {
        throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const result = await dbQuery<{
        id: string;
        status: "published" | "pending" | "hidden";
        updated_at: string;
      }>(
        `
        update public.restaurant_reviews
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning id, status, updated_at
      `,
        [reviewId, payload.status],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.get("/company/:companyId", requireAuth, async (request, response, next) => {
  try {
    const { companyId } = companyParamsSchema.parse(request.params);

    if (!request.auth) {
      throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    await assertCanAccessCompany(request.auth.userId, request.auth.role, companyId);

    const result = await dbQuery<CompanyRestaurantRow>(
      `
        select id, name, slug, company_id, is_active
        from public.restaurants
        where company_id = $1
        order by name asc
      `,
      [companyId],
    );

    response.json({
      ok: true,
      data: result.rows,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});

adminRestaurantsRouter.get("/:restaurantId", requireAuth, async (request, response, next) => {
  try {
    const { restaurantId } = restaurantParamsSchema.parse(request.params);

    if (!request.auth) {
      throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

    const restaurant = await fetchRestaurantById(restaurantId);

    if (!restaurant) {
      throw new HttpError(404, "Restaurant not found.", "RESTAURANT_NOT_FOUND");
    }

    response.json({
      ok: true,
      data: restaurant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});

adminRestaurantsRouter.get(
  "/:restaurantId/reviews",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const result = await dbQuery(
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
        order by created_at desc
      `,
        [restaurantId],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.get(
  "/by-slug/:slug/interactions",
  requireAuth,
  async (request, response, next) => {
    try {
      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const restaurantResult = await dbQuery<{ id: string; company_id: string | null }>(
        `
        select id, company_id
        from public.restaurants
        where slug = $1
        limit 1
      `,
        [request.params.slug],
      );

      const restaurant = restaurantResult.rows[0];

      if (!restaurant?.company_id) {
        response.json({
          ok: true,
          data: [],
        });
        return;
      }

      await assertCanAccessCompany(request.auth.userId, request.auth.role, restaurant.company_id);

      const result = await dbQuery(
        `
        select
          id,
          restaurant_id,
          action,
          source,
          interaction_type,
          created_at
        from public.restaurant_interactions
        where restaurant_id = $1
        order by created_at desc
      `,
        [restaurant.id],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },
);

adminRestaurantsRouter.patch("/:restaurantId", requireAuth, async (request, response, next) => {
  try {
    const { restaurantId } = restaurantParamsSchema.parse(request.params);
    const payload = updateRestaurantSchema.parse(request.body);

    if (!request.auth) {
      throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

    const priceLevel = payload.priceLabel === "€" ? 1 : payload.priceLabel === "€€€" ? 3 : 2;

    const result = await dbQuery<{ id: string }>(
      `
        update public.restaurants
        set
          name = $2,
          category = $3,
          cuisine_type = $4,
          description = $5,
          price_label = $6,
          price_level = $7,
          is_open = $8,
          address = $9,
          city = $10,
          country = $11,
          phone = nullif($12, ''),
          is_active = $13,
          hours_summary = nullif($14, ''),
          menu_url = nullif($15, ''),
          google_maps_url = nullif($16, ''),
          waze_url = nullif($17, ''),
          updated_at = now()
        where id = $1
        returning id
      `,
      [
        restaurantId,
        payload.name,
        payload.category,
        payload.cuisineType,
        payload.description,
        payload.priceLabel,
        priceLevel,
        payload.isOpen,
        payload.address,
        payload.city,
        payload.country,
        payload.phone,
        payload.isActive,
        payload.hoursSummary,
        payload.menuUrl,
        payload.googleMapsUrl,
        payload.wazeUrl,
      ],
    );

    if (!result.rows[0]) {
      throw new HttpError(404, "Restaurant not found.", "RESTAURANT_NOT_FOUND");
    }

    response.json({
      ok: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});

adminRestaurantsRouter.put("/:restaurantId/tags", requireAuth, async (request, response, next) => {
  try {
    const { restaurantId } = restaurantParamsSchema.parse(request.params);
    const payload = updateTagsSchema.parse(request.body);

    if (!request.auth) {
      throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

    const normalizedSlugs = Array.from(
      new Set(payload.tagSlugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean)),
    );

    await dbQuery(
      `
        delete from public.restaurant_tags
        where restaurant_id = $1
      `,
      [restaurantId],
    );

    if (normalizedSlugs.length > 0) {
      await dbQuery(
        `
          insert into public.restaurant_tags (restaurant_id, tag_id)
          select $1, t.id
          from public.tags t
          where t.is_active = true
            and t.slug = any($2::text[])
          on conflict (restaurant_id, tag_id) do nothing
        `,
        [restaurantId, normalizedSlugs],
      );
    }

    const countResult = await dbQuery<{ tag_count: number }>(
      `
        select count(*)::integer as tag_count
        from public.restaurant_tags
        where restaurant_id = $1
      `,
      [restaurantId],
    );

    response.json({
      ok: true,
      data: {
        restaurant_id: restaurantId,
        tag_count: countResult.rows[0]?.tag_count ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});

const offerParamsSchema = z.object({
  offerId: z.string().uuid(),
});

const upsertOfferSchema = z.object({
  offerId: z.string().uuid().nullable(),
  code: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  conditions: z.string().trim().max(500),
  isActive: z.boolean(),
});

const updateOfferStatusSchema = z.object({
  isActive: z.boolean(),
});

const openingHoursSchema = z.object({
  hours: z.array(
    z.object({
      day_of_week: z.number().int().min(1).max(7),
      day_label: z.string().trim().min(1).max(40),
      hours_text: z.string().trim().max(120),
      is_closed: z.boolean(),
    }),
  ),
});

adminRestaurantsRouter.get(
  "/:restaurantId/offers",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const result = await dbQuery(
        `
        select
          id,
          restaurant_id,
          code,
          title,
          description,
          conditions,
          is_active,
          created_at,
          updated_at
        from public.restaurant_offers
        where restaurant_id = $1
        order by created_at desc
      `,
        [restaurantId],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.post(
  "/:restaurantId/offers",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);
      const payload = upsertOfferSchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      if (payload.offerId) {
        const existingOffer = await dbQuery<{ restaurant_id: string }>(
          `
          select restaurant_id
          from public.restaurant_offers
          where id = $1
          limit 1
        `,
          [payload.offerId],
        );

        if (!existingOffer.rows[0]) {
          throw new HttpError(404, "Offer not found.", "OFFER_NOT_FOUND");
        }

        if (existingOffer.rows[0].restaurant_id !== restaurantId) {
          throw new HttpError(
            400,
            "Offer does not belong to this restaurant.",
            "OFFER_RESTAURANT_MISMATCH",
          );
        }

        const result = await dbQuery(
          `
          update public.restaurant_offers
          set
            code = upper($2),
            title = $3,
            description = $4,
            conditions = nullif($5, ''),
            is_active = $6,
            updated_at = now()
          where id = $1
          returning
            id,
            restaurant_id,
            code,
            title,
            description,
            conditions,
            is_active,
            created_at,
            updated_at
        `,
          [
            payload.offerId,
            payload.code,
            payload.title,
            payload.description,
            payload.conditions,
            payload.isActive,
          ],
        );

        response.json({
          ok: true,
          data: result.rows,
        });
        return;
      }

      const result = await dbQuery(
        `
        insert into public.restaurant_offers (
          restaurant_id,
          code,
          title,
          description,
          conditions,
          is_active
        )
        values ($1, upper($2), $3, $4, nullif($5, ''), $6)
        returning
          id,
          restaurant_id,
          code,
          title,
          description,
          conditions,
          is_active,
          created_at,
          updated_at
      `,
        [
          restaurantId,
          payload.code,
          payload.title,
          payload.description,
          payload.conditions,
          payload.isActive,
        ],
      );

      response.status(201).json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.patch(
  "/offers/:offerId/status",
  requireAuth,
  async (request, response, next) => {
    try {
      const { offerId } = offerParamsSchema.parse(request.params);
      const payload = updateOfferStatusSchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const offerRestaurant = await dbQuery<{ restaurant_id: string }>(
        `
        select restaurant_id
        from public.restaurant_offers
        where id = $1
        limit 1
      `,
        [offerId],
      );

      const restaurantId = offerRestaurant.rows[0]?.restaurant_id;

      if (!restaurantId) {
        throw new HttpError(404, "Offer not found.", "OFFER_NOT_FOUND");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const result = await dbQuery(
        `
        update public.restaurant_offers
        set
          is_active = $2,
          updated_at = now()
        where id = $1
        returning id, restaurant_id, is_active, updated_at
      `,
        [offerId, payload.isActive],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.get(
  "/:restaurantId/opening-hours",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const result = await dbQuery(
        `
        select
          id,
          restaurant_id,
          day_of_week,
          day_label,
          hours_text,
          is_closed,
          created_at
        from public.restaurant_opening_hours
        where restaurant_id = $1
        order by day_of_week asc
      `,
        [restaurantId],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

adminRestaurantsRouter.put(
  "/:restaurantId/opening-hours",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);
      const payload = openingHoursSchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      for (const hour of payload.hours) {
        await dbQuery(
          `
          insert into public.restaurant_opening_hours (
            restaurant_id,
            day_of_week,
            day_label,
            hours_text,
            is_closed
          )
          values ($1, $2, $3, $4, $5)
          on conflict on constraint restaurant_opening_hours_restaurant_id_day_of_week_key
          do update set
            day_label = excluded.day_label,
            hours_text = excluded.hours_text,
            is_closed = excluded.is_closed
        `,
          [
            restaurantId,
            hour.day_of_week,
            hour.day_label,
            hour.is_closed ? "Fermé" : hour.hours_text,
            hour.is_closed,
          ],
        );
      }

      const result = await dbQuery(
        `
        select
          id,
          restaurant_id,
          day_of_week,
          day_label,
          hours_text,
          is_closed,
          created_at
        from public.restaurant_opening_hours
        where restaurant_id = $1
        order by day_of_week asc
      `,
        [restaurantId],
      );

      response.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);

const addPhotoSchema = z.object({
  url: z.string().trim().min(1).max(1000),
  category: z.enum(["Plats", "Menu", "Salle", "Terrasse", "Façade", "Ambiance", "Parking"]),
});

adminRestaurantsRouter.post(
  "/:restaurantId/photos",
  requireAuth,
  async (request, response, next) => {
    try {
      const { restaurantId } = restaurantParamsSchema.parse(request.params);
      const payload = addPhotoSchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      await assertCanAccessRestaurant(request.auth.userId, request.auth.role, restaurantId);

      const sortOrderResult = await dbQuery<{ next_sort_order: number }>(
        `
        select coalesce(max(sort_order), -1) + 1 as next_sort_order
        from public.restaurant_photos
        where restaurant_id = $1
      `,
        [restaurantId],
      );

      const nextSortOrder = sortOrderResult.rows[0]?.next_sort_order ?? 0;

      const result = await dbQuery(
        `
        insert into public.restaurant_photos (
          restaurant_id,
          url,
          category,
          is_client_photo,
          author_name,
          sort_order
        )
        values ($1, $2, $3, false, null, $4)
        returning
          id,
          restaurant_id,
          url,
          category,
          is_client_photo,
          author_name,
          sort_order,
          created_at
      `,
        [restaurantId, payload.url, payload.category, nextSortOrder],
      );

      response.status(201).json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new HttpError(400, "Invalid request body.", "VALIDATION_ERROR"));
        return;
      }

      next(error);
    }
  },
);
