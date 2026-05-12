import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { z } from "zod";
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

const uploadBodySchema = z.object({
  restaurantId: z.string().uuid(),
});

const RESTAURANT_PHOTOS_FOLDER = "restaurant-photos";
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadsRoot = fileURLToPath(new URL("../../../uploads", import.meta.url));
const restaurantPhotosRoot = path.join(uploadsRoot, RESTAURANT_PHOTOS_FOLDER);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractLocalRestaurantPhotoStoragePath(url: string) {
  try {
    const parsedUrl = new URL(url);
    const marker = `/uploads/${RESTAURANT_PHOTOS_FOLDER}/`;
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

function buildPublicUploadUrl(
  request: {
    headers: Record<string, unknown>;
    protocol: string;
    get: (name: string) => string | undefined;
  },
  relativePath: string,
) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : request.protocol;
  const host = request.get("host");

  return `${protocol}://${host}/uploads/${RESTAURANT_PHOTOS_FOLDER}/${relativePath}`;
}

adminRestaurantPhotosRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (request, response, next) => {
    try {
      const payload = uploadBodySchema.parse(request.body);

      if (!request.auth) {
        throw new HttpError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      if (!request.file) {
        throw new HttpError(400, "Photo file is required.", "PHOTO_FILE_REQUIRED");
      }

      const detectedFileType = await fileTypeFromBuffer(request.file.buffer);

      if (
        !detectedFileType ||
        !ALLOWED_IMAGE_MIME_TYPES.has(detectedFileType.mime) ||
        request.file.mimetype !== detectedFileType.mime
      ) {
        throw new HttpError(400, "Only JPEG, PNG or WebP image files are allowed.", "PHOTO_FILE_INVALID_TYPE");
      }

      const restaurantResult = await dbQuery<RestaurantCompanyRow>(
        `
          select id, company_id
          from public.restaurants
          where id = $1
          limit 1
        `,
        [payload.restaurantId],
      );

      const restaurant = restaurantResult.rows[0];

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
        throw new HttpError(403, "Not allowed to upload this photo.", "PHOTO_UPLOAD_FORBIDDEN");
      }

      const safeFileName = sanitizeFileName(request.file.originalname) || "photo";
      const storedFileName = `${Date.now()}-${safeFileName}`;
      const restaurantFolder = path.join(restaurantPhotosRoot, payload.restaurantId);
      const filePath = path.join(restaurantFolder, storedFileName);
      const relativePath = `${payload.restaurantId}/${storedFileName}`;

      await fs.mkdir(restaurantFolder, { recursive: true });
      await fs.writeFile(filePath, request.file.buffer);

      response.status(201).json({
        ok: true,
        data: {
          publicUrl: buildPublicUploadUrl(request, relativePath),
          storagePath: relativePath,
        },
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

    const storagePath = extractLocalRestaurantPhotoStoragePath(photo.url);

    if (storagePath) {
      const filePath = path.join(restaurantPhotosRoot, storagePath);

      if (!filePath.startsWith(restaurantPhotosRoot)) {
        throw new HttpError(400, "Invalid photo storage path.", "PHOTO_STORAGE_PATH_INVALID");
      }

      await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          throw error;
        }
      });
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
