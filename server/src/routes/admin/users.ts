import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminUsersRouter = Router();

adminUsersRouter.post("/", requireAuth, requireSuperAdmin, () => {
  throw new HttpError(
    501,
    "Admin user creation is not implemented yet.",
    "ADMIN_USER_CREATION_NOT_IMPLEMENTED",
  );
});