import { Router } from "express";
import { z } from "zod";
import { createSupabaseAdminClient } from "../../lib/supabase-server.js";
import { requireAuth } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminRestaurantPhotosRouter = Router();

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

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: photo, error: photoError } = await supabaseAdmin
      .from("restaurant_photos")
      .select("id, restaurant_id, url")
      .eq("id", photoId)
      .maybeSingle();

    if (photoError) {
      throw new HttpError(500, photoError.message, "PHOTO_LOOKUP_FAILED");
    }

    if (!photo) {
      throw new HttpError(404, "Photo not found.", "PHOTO_NOT_FOUND");
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id, company_id")
      .eq("id", photo.restaurant_id)
      .maybeSingle();

    if (restaurantError) {
      throw new HttpError(500, restaurantError.message, "RESTAURANT_LOOKUP_FAILED");
    }

    if (!restaurant?.company_id) {
      throw new HttpError(
        400,
        "Photo is not linked to a company restaurant.",
        "PHOTO_RESTAURANT_COMPANY_MISSING",
      );
    }

    const isSuperAdmin = request.auth.role === "superadmin";
    let isCompanyMember = false;

    if (!isSuperAdmin && (request.auth.role === "admin" || request.auth.role === "user")) {
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from("company_users")
        .select("id")
        .eq("user_id", request.auth.userId)
        .eq("company_id", restaurant.company_id)
        .maybeSingle();

      if (membershipError) {
        throw new HttpError(500, membershipError.message, "COMPANY_MEMBERSHIP_LOOKUP_FAILED");
      }

      isCompanyMember = Boolean(membership);
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

    const { error: deleteError } = await supabaseAdmin
      .from("restaurant_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      throw new HttpError(500, deleteError.message, "PHOTO_DB_DELETE_FAILED");
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
