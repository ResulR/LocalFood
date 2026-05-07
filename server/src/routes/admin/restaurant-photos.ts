import { Router } from "express";
import { z } from "zod";
import { createSupabaseAdminClient } from "../../lib/supabase-server.js";
import { dbQuery } from "../../lib/db.js";
import { requireAuth } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminRestaurantPhotosRouter = Router();

type PhotoRow = {
  id: string;
  restaurant_id: string;
  url: string;
};

type RestaurantCompanyRow = {
  id: string;
  company_id: string | null;
};

type MembershipRow = {
  id: string;
};

const paramsSchema = z.object({
  photoId: z.string().uuid(),
});

const RESTAURANT_PHOTOS_BUCKET = "restaurant-photos";

function extractRestaurantPhotoStoragePath(url: string) {
  try {
    const parsedUrl = new URL(url);
    const marker = `/storage/v1/object/public/${RESTAURANT_PHOTOS_BUCKET}/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const rawPath = parsedUrl.pathname.slice(markerIndex + marker.length);

    if (!rawPath) {
      return null;
    }

    return decodeURIComponent(rawPath);
  } catch {
    return null;
  }
}

adminRestaurantPhotosRouter.delete("/:photoId", requireAuth, async (request, response, next) => {
  try {
    const { photoId } = paramsSchema.parse(request.params);

    if (!request.auth) {
      throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    const photoResult = await dbQuery<PhotoRow>(
      `
        select id, restaurant_id, url
        from public.restaurant_photos
        where id = $1
        limit 1
      `,
      [photoId],
    );

    const photo = photoResult.rows[0];

    if (!photo) {
      throw new HttpError(404, "Photo not found.", "PHOTO_NOT_FOUND");
    }

    const restaurantResult = await dbQuery<RestaurantCompanyRow>(
      `
        select id, company_id
        from public.restaurants
        where id = $1
        limit 1
      `,
      [photo.restaurant_id],
    );

    const restaurant = restaurantResult.rows[0];

    if (!restaurant?.company_id) {
      throw new HttpError(
        400,
        "Photo is not linked to a company restaurant.",
        "PHOTO_RESTAURANT_COMPANY_MISSING",
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const isSuperAdmin = request.auth.role === "superadmin";
    let isCompanyMember = false;

    if (!isSuperAdmin && (request.auth.role === "admin" || request.auth.role === "user")) {
      const membershipResult = await dbQuery<MembershipRow>(
        `
          select id
          from public.company_users
          where user_id = $1
            and company_id = $2
          limit 1
        `,
        [request.auth.userId, restaurant.company_id],
      );

      isCompanyMember = Boolean(membershipResult.rows[0]);
    }

    if (!isSuperAdmin && !isCompanyMember) {
      throw new HttpError(403, "Not allowed to delete this photo.", "PHOTO_DELETE_FORBIDDEN");
    }

    const storagePath = extractRestaurantPhotoStoragePath(photo.url);

    if (storagePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(RESTAURANT_PHOTOS_BUCKET)
        .remove([storagePath]);

      if (storageError) {
        throw new HttpError(500, storageError.message, "PHOTO_STORAGE_DELETE_FAILED");
      }
    }

    const deleteResult = await dbQuery<{ id: string }>(
      `
        delete from public.restaurant_photos
        where id = $1
        returning id
      `,
      [photoId],
    );

    if (!deleteResult.rows[0]) {
      throw new HttpError(404, "Photo not found.", "PHOTO_NOT_FOUND");
    }

    response.json({
      ok: true,
      data: {
        photoId,
        storageDeleted: Boolean(storagePath),
        storagePath,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, "Invalid request.", "VALIDATION_ERROR"));
      return;
    }

    next(error);
  }
});
