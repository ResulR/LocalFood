import { Router } from "express";
import { z } from "zod";
import { dbQuery } from "../../lib/db.js";
import { requireAuth, requireSuperAdmin } from "../../middlewares/auth.js";
import { HttpError } from "../../middlewares/error-handler.js";

export const adminCompaniesRouter = Router();

type CompanyOverviewRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type RestaurantCompanyRow = {
  id: string;
  company_id: string | null;
};

type CompanyUserRow = {
  id: string;
  company_id: string;
};

const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).nullable(),
  isActive: z.boolean().default(true),
});

const updateCompanySchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable(),
  isActive: z.boolean(),
});

const companyParamsSchema = z.object({
  companyId: z.string().uuid(),
});

adminCompaniesRouter.get(
  "/overview",
  requireAuth,
  requireSuperAdmin,
  async (_request, response, next) => {
    try {
      const [companiesResult, restaurantsResult, companyUsersResult] = await Promise.all([
        dbQuery<CompanyOverviewRow>(
          `
            select
              id,
              name,
              slug,
              description,
              is_active,
              created_at
            from public.companies
            order by created_at desc
          `,
        ),
        dbQuery<RestaurantCompanyRow>(
          `
            select
              id,
              company_id
            from public.restaurants
          `,
        ),
        dbQuery<CompanyUserRow>(
          `
            select
              id,
              company_id
            from public.company_users
          `,
        ),
      ]);

      response.json({
        ok: true,
        data: {
          companies: companiesResult.rows,
          restaurants: restaurantsResult.rows,
          companyUsers: companyUsersResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

adminCompaniesRouter.post("/", requireAuth, requireSuperAdmin, async (request, response, next) => {
  try {
    const payload = createCompanySchema.parse(request.body);

    const result = await dbQuery<CompanyOverviewRow>(
      `
        insert into public.companies (
          name,
          slug,
          description,
          is_active
        )
        values ($1, $2, $3, $4)
        returning
          id,
          name,
          slug,
          description,
          is_active,
          created_at
      `,
      [payload.name, payload.slug, payload.description, payload.isActive],
    );

    response.status(201).json({
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

adminCompaniesRouter.patch(
  "/:companyId",
  requireAuth,
  requireSuperAdmin,
  async (request, response, next) => {
    try {
      const { companyId } = companyParamsSchema.parse(request.params);
      const payload = updateCompanySchema.parse(request.body);

      const result = await dbQuery<CompanyOverviewRow>(
        `
          update public.companies
          set
            name = $2,
            description = $3,
            is_active = $4,
            updated_at = now()
          where id = $1
          returning
            id,
            name,
            slug,
            description,
            is_active,
            created_at
        `,
        [companyId, payload.name, payload.description, payload.isActive],
      );

      const company = result.rows[0];

      if (!company) {
        throw new HttpError(404, "Company not found.", "COMPANY_NOT_FOUND");
      }

      response.json({
        ok: true,
        data: company,
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
