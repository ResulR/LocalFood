import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Search, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/super-admin/companies")({
  head: () => ({ meta: [{ title: "Entreprises — SuperAdmin LocalFood" }] }),
  component: SuperAdminCompaniesPage,
});

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type RestaurantRow = {
  id: string;
  company_id: string | null;
};

type CompanyUserRow = {
  id: string;
  company_id: string;
};

type CompanyListRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  restaurantsCount: number;
  usersCount: number;
};

function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUserRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCompanies() {
      setLoadingCompanies(true);
      setErrorMessage("");

      const [companiesResult, restaurantsResult, companyUsersResult] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, slug, description, is_active, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("restaurants").select("id, company_id"),
        supabase.from("company_users").select("id, company_id"),
      ]);

      if (cancelled) {
        return;
      }

      if (companiesResult.error) {
        setErrorMessage(companiesResult.error.message);
        setLoadingCompanies(false);
        return;
      }

      if (restaurantsResult.error) {
        setErrorMessage(restaurantsResult.error.message);
        setLoadingCompanies(false);
        return;
      }

      if (companyUsersResult.error) {
        setErrorMessage(companyUsersResult.error.message);
        setLoadingCompanies(false);
        return;
      }

      setCompanies((companiesResult.data ?? []) as CompanyRow[]);
      setRestaurants((restaurantsResult.data ?? []) as RestaurantRow[]);
      setCompanyUsers((companyUsersResult.data ?? []) as CompanyUserRow[]);
      setLoadingCompanies(false);
    }

    loadCompanies().catch((error) => {
      console.error("Failed to load super admin companies:", error);

      if (!cancelled) {
        setErrorMessage("Impossible de charger les entreprises.");
        setLoadingCompanies(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<CompanyListRow[]>(() => {
    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description ?? "Aucune description",
      isActive: company.is_active,
      restaurantsCount: restaurants.filter((restaurant) => restaurant.company_id === company.id)
        .length,
      usersCount: companyUsers.filter((membership) => membership.company_id === company.id).length,
    }));
  }, [companies, companyUsers, restaurants]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [row.name, row.slug, row.description].join(" ").toLowerCase().includes(normalizedSearch),
    );
  }, [rows, search]);

  return (
    <div className="max-w-[1400px] space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            SuperAdmin
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Entreprises</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue globale des entreprises liées aux restaurants LocalFood.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">Total entreprises</div>
          <div className="font-display text-2xl font-semibold">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom, slug, description..."
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {loadingCompanies && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des entreprises...
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {!loadingCompanies && !errorMessage && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Aucune entreprise trouvée.</p>
        </div>
      )}

      {!loadingCompanies && !errorMessage && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Entreprise</th>
                  <th className="px-5 py-3 text-left font-medium">Slug</th>
                  <th className="px-5 py-3 text-left font-medium">Restaurants</th>
                  <th className="px-5 py-3 text-left font-medium">Utilisateurs</th>
                  <th className="px-5 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-medium">{row.name}</div>
                      <div className="max-w-sm truncate text-xs text-muted-foreground">
                        {row.description}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{row.slug}</td>
                    <td className="px-5 py-4 font-medium">{row.restaurantsCount}</td>
                    <td className="px-5 py-4 font-medium">{row.usersCount}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.isActive
                            ? "bg-success/15 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
        Cette première version affiche les entreprises uniquement. La création, modification et
        désactivation seront ajoutées étape par étape après validation de cette base.
      </div>
    </div>
  );
}
