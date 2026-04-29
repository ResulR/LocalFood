import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Shield, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/super-admin/restaurants")({
  head: () => ({ meta: [{ title: "Restaurants — SuperAdmin LocalFood" }] }),
  component: SuperAdminRestaurantsPage,
});

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine_type: string;
  city: string;
  is_active: boolean;
  company_id: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type RestaurantListRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisineType: string;
  city: string;
  isActive: boolean;
  companyId: string | null;
  companyName: string;
};

function SuperAdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [savingRestaurantId, setSavingRestaurantId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setErrorMessage("");

    const [restaurantsResult, companiesResult] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, slug, category, cuisine_type, city, is_active, company_id")
        .order("name"),
      supabase.from("companies").select("id, name, slug, is_active").order("name"),
    ]);

    if (restaurantsResult.error) {
      setErrorMessage(restaurantsResult.error.message);
      setLoadingRestaurants(false);
      return;
    }

    if (companiesResult.error) {
      setErrorMessage(companiesResult.error.message);
      setLoadingRestaurants(false);
      return;
    }

    setRestaurants((restaurantsResult.data ?? []) as RestaurantRow[]);
    setCompanies((companiesResult.data ?? []) as CompanyRow[]);
    setLoadingRestaurants(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadRestaurants().catch((error) => {
      console.error("Failed to load super admin restaurants:", error);

      if (!cancelled) {
        setErrorMessage("Impossible de charger les restaurants.");
        setLoadingRestaurants(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRestaurants]);

  const rows = useMemo<RestaurantListRow[]>(() => {
    const companyById = new Map(companies.map((company) => [company.id, company.name]));

    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      category: restaurant.category,
      cuisineType: restaurant.cuisine_type,
      city: restaurant.city,
      isActive: restaurant.is_active,
      companyId: restaurant.company_id,
      companyName: restaurant.company_id
        ? (companyById.get(restaurant.company_id) ?? "Entreprise inconnue")
        : "Aucune entreprise",
    }));
  }, [companies, restaurants]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [row.name, row.slug, row.category, row.cuisineType, row.city, row.companyName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [rows, search]);

  const changeRestaurantCompany = async (row: RestaurantListRow, nextCompanyId: string) => {
    const companyId = nextCompanyId || null;

    if (row.companyId === companyId) {
      return;
    }

    setSavingRestaurantId(row.id);

    const { error } = await supabase
      .from("restaurants")
      .update({
        company_id: companyId,
      })
      .eq("id", row.id)
      .select("id")
      .single();

    if (error) {
      setSavingRestaurantId(null);
      toast.error("Impossible de modifier l’entreprise du restaurant", {
        description: error.message,
      });
      await loadRestaurants();
      return;
    }

    const companyName = companyId
      ? companies.find((company) => company.id === companyId)?.name
      : "Aucune entreprise";

    toast.success("Restaurant mis à jour", {
      description: `${row.name} → ${companyName ?? "Entreprise inconnue"}.`,
    });

    setSavingRestaurantId(null);
    await loadRestaurants();
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            SuperAdmin
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Restaurants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue globale des restaurants et de leur entreprise propriétaire.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">Total restaurants</div>
          <div className="font-display text-2xl font-semibold">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par restaurant, ville, entreprise..."
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {loadingRestaurants && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des restaurants...
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {!loadingRestaurants && !errorMessage && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Store className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun restaurant trouvé.</p>
        </div>
      )}

      {!loadingRestaurants && !errorMessage && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Restaurant</th>
                  <th className="px-5 py-3 text-left font-medium">Ville</th>
                  <th className="px-5 py-3 text-left font-medium">Catégorie</th>
                  <th className="px-5 py-3 text-left font-medium">Entreprise</th>
                  <th className="px-5 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isSaving = savingRestaurantId === row.id;

                  return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.slug}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{row.city}</td>
                      <td className="px-5 py-4">
                        <div>{row.category}</div>
                        <div className="text-xs text-muted-foreground">{row.cuisineType}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={row.companyId ?? ""}
                            disabled={isSaving}
                            onChange={(event) => changeRestaurantCompany(row, event.target.value)}
                            className="w-fit max-w-[240px] rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">Aucune entreprise</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>

                          {isSaving && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Sauvegarde...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.isActive
                              ? "bg-success/15 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {row.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
        Cette page permet d’assigner un restaurant à une entreprise. Une entreprise pourra donc
        gérer plusieurs restaurants ou plusieurs localisations.
      </div>
    </div>
  );
}
