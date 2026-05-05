import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Save, Search, Shield, Store, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAdminI18n } from "@/lib/admin-i18n";

export const Route = createFileRoute("/super-admin/restaurants")({
  head: () => ({ meta: [{ title: "Restaurants — SuperAdmin LocalFood" }] }),
  component: SuperAdminRestaurantsPage,
});

type PriceLabel = "€" | "€€" | "€€€";

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine_type: string;
  description: string;
  rating: number;
  reviews_count: number;
  price_level: number;
  price_label: PriceLabel;
  is_open: boolean;
  address: string;
  city: string;
  country: string;
  phone: string | null;
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
  description: string;
  rating: number;
  reviewsCount: number;
  priceLevel: number;
  priceLabel: PriceLabel;
  isOpen: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
  isActive: boolean;
  companyId: string | null;
  companyName: string;
};

type EditingRestaurant = {
  id: string;
  name: string;
  category: string;
  cuisineType: string;
  description: string;
  priceLabel: PriceLabel;
  isOpen: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
};

const PRICE_OPTIONS: { label: PriceLabel; level: number }[] = [
  { label: "€", level: 1 },
  { label: "€€", level: 2 },
  { label: "€€€", level: 3 },
];

function getPriceLevel(priceLabel: PriceLabel) {
  return PRICE_OPTIONS.find((price) => price.label === priceLabel)?.level ?? 2;
}

function SuperAdminRestaurantsPage() {
  const { tAdmin } = useAdminI18n();
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [savingRestaurantId, setSavingRestaurantId] = useState<string | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<EditingRestaurant | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setErrorMessage("");

    const [restaurantsResult, companiesResult] = await Promise.all([
      supabase
        .from("restaurants")
        .select(
          `
            id,
            name,
            slug,
            category,
            cuisine_type,
            description,
            rating,
            reviews_count,
            price_level,
            price_label,
            is_open,
            address,
            city,
            country,
            phone,
            is_active,
            company_id
          `,
        )
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
        setErrorMessage(tAdmin("admin.superAdminRestaurants.loadError"));
        setLoadingRestaurants(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRestaurants, tAdmin]);

  const rows = useMemo<RestaurantListRow[]>(() => {
    const companyById = new Map(companies.map((company) => [company.id, company.name]));

    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      category: restaurant.category,
      cuisineType: restaurant.cuisine_type,
      description: restaurant.description,
      rating: Number(restaurant.rating),
      reviewsCount: restaurant.reviews_count,
      priceLevel: restaurant.price_level,
      priceLabel: restaurant.price_label,
      isOpen: restaurant.is_open,
      address: restaurant.address,
      city: restaurant.city,
      country: restaurant.country,
      phone: restaurant.phone ?? "",
      isActive: restaurant.is_active,
      companyId: restaurant.company_id,
      companyName: restaurant.company_id
        ? (companyById.get(restaurant.company_id) ??
          tAdmin("admin.superAdminRestaurants.unknownCompany"))
        : tAdmin("admin.superAdminRestaurants.noCompany"),
    }));
  }, [companies, restaurants, tAdmin]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.name,
        row.slug,
        row.category,
        row.cuisineType,
        row.description,
        row.city,
        row.address,
        row.companyName,
      ]
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
      toast.error(tAdmin("admin.superAdminRestaurants.updateCompanyError"), {
        description: error.message,
      });
      await loadRestaurants();
      return;
    }

    const companyName = companyId
      ? companies.find((company) => company.id === companyId)?.name
      : tAdmin("admin.superAdminRestaurants.noCompany");

    toast.success(tAdmin("admin.superAdminRestaurants.updated"), {
      description: `${row.name} → ${companyName ?? tAdmin("admin.superAdminRestaurants.unknownCompany")}.`,
    });

    setSavingRestaurantId(null);
    await loadRestaurants();
  };

  const changeRestaurantStatus = async (row: RestaurantListRow, nextIsActive: boolean) => {
    if (row.isActive === nextIsActive) {
      return;
    }

    setSavingRestaurantId(row.id);

    const { error } = await supabase
      .from("restaurants")
      .update({
        is_active: nextIsActive,
      })
      .eq("id", row.id)
      .select("id")
      .single();

    if (error) {
      setSavingRestaurantId(null);
      toast.error(tAdmin("admin.superAdminRestaurants.updateStatusError"), {
        description: error.message,
      });
      await loadRestaurants();
      return;
    }

    toast.success(tAdmin("admin.superAdminRestaurants.statusUpdated"), {
      description: `${row.name} ${tAdmin("admin.superAdminRestaurants.isNow")} ${
        nextIsActive
          ? tAdmin("admin.superAdminRestaurants.activeLower")
          : tAdmin("admin.superAdminRestaurants.inactiveLower")
      }.`,
    });

    setSavingRestaurantId(null);
    await loadRestaurants();
  };

  const startEditingRestaurant = (row: RestaurantListRow) => {
    setEditingRestaurant({
      id: row.id,
      name: row.name,
      category: row.category,
      cuisineType: row.cuisineType,
      description: row.description,
      priceLabel: row.priceLabel,
      isOpen: row.isOpen,
      address: row.address,
      city: row.city,
      country: row.country,
      phone: row.phone,
    });
  };

  const cancelEditingRestaurant = () => {
    setEditingRestaurant(null);
  };

  const saveRestaurant = async () => {
    if (!editingRestaurant) {
      return;
    }

    const name = editingRestaurant.name.trim();
    const category = editingRestaurant.category.trim();
    const cuisineType = editingRestaurant.cuisineType.trim();
    const description = editingRestaurant.description.trim();
    const address = editingRestaurant.address.trim();
    const city = editingRestaurant.city.trim();
    const country = editingRestaurant.country.trim();
    const phone = editingRestaurant.phone.trim();

    if (!name || !category || !cuisineType || !description || !address || !city || !country) {
      toast.error(tAdmin("admin.superAdminRestaurants.requiredFields"));
      return;
    }

    setSavingRestaurantId(editingRestaurant.id);

    const { error } = await supabase
      .from("restaurants")
      .update({
        name,
        category,
        cuisine_type: cuisineType,
        description,
        price_label: editingRestaurant.priceLabel,
        price_level: getPriceLevel(editingRestaurant.priceLabel),
        is_open: editingRestaurant.isOpen,
        address,
        city,
        country,
        phone: phone || null,
      })
      .eq("id", editingRestaurant.id)
      .select("id")
      .single();

    if (error) {
      setSavingRestaurantId(null);
      toast.error(tAdmin("admin.superAdminRestaurants.updateError"), { description: error.message });
      await loadRestaurants();
      return;
    }

    toast.success(tAdmin("admin.superAdminRestaurants.updated"), {
      description: `${name} ${tAdmin("admin.superAdminRestaurants.updatedDescription")}`,
    });

    setEditingRestaurant(null);
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
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {tAdmin("admin.superAdminRestaurants.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tAdmin("admin.superAdminRestaurants.subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">
            {tAdmin("admin.superAdminRestaurants.total")}
          </div>
          <div className="font-display text-2xl font-semibold">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tAdmin("admin.superAdminRestaurants.searchPlaceholder")}
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {loadingRestaurants && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tAdmin("admin.superAdminRestaurants.loading")}
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
          <p className="mt-3 text-sm text-muted-foreground">
            {tAdmin("admin.superAdminRestaurants.empty")}
          </p>
        </div>
      )}

      {!loadingRestaurants && !errorMessage && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminRestaurants.restaurant")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminRestaurants.infos")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminRestaurants.company")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminRestaurants.status")}
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    {tAdmin("admin.superAdminRestaurants.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isSaving = savingRestaurantId === row.id;
                  const isEditing = editingRestaurant?.id === row.id;

                  return (
                    <tr key={row.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-5 py-4 min-w-[280px]">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editingRestaurant.name}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  name: event.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                            />
                            <textarea
                              value={editingRestaurant.description}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  description: event.target.value,
                                })
                              }
                              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                            <div className="text-xs text-muted-foreground">
                              {tAdmin("admin.superAdminRestaurants.stableSlug")} {row.slug}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">{row.slug}</div>
                            <div className="mt-1 max-w-xs text-xs text-muted-foreground line-clamp-2">
                              {row.description}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4 min-w-[320px]">
                        {isEditing ? (
                          <div className="grid gap-2">
                            <input
                              value={editingRestaurant.category}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  category: event.target.value,
                                })
                              }
                              placeholder={tAdmin("admin.superAdminRestaurants.category")}
                              className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                            <input
                              value={editingRestaurant.cuisineType}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  cuisineType: event.target.value,
                                })
                              }
                              placeholder={tAdmin("admin.superAdminRestaurants.cuisineType")}
                              className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                            <input
                              value={editingRestaurant.address}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  address: event.target.value,
                                })
                              }
                              placeholder={tAdmin("admin.superAdminRestaurants.address")}
                              className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={editingRestaurant.city}
                                onChange={(event) =>
                                  setEditingRestaurant({
                                    ...editingRestaurant,
                                    city: event.target.value,
                                  })
                                }
                                placeholder={tAdmin("admin.superAdminRestaurants.city")}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                              />
                              <input
                                value={editingRestaurant.country}
                                onChange={(event) =>
                                  setEditingRestaurant({
                                    ...editingRestaurant,
                                    country: event.target.value,
                                  })
                                }
                                placeholder={tAdmin("admin.superAdminRestaurants.country")}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                              />
                            </div>
                            <input
                              value={editingRestaurant.phone}
                              onChange={(event) =>
                                setEditingRestaurant({
                                  ...editingRestaurant,
                                  phone: event.target.value,
                                })
                              }
                              placeholder={tAdmin("admin.superAdminRestaurants.phone")}
                              className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editingRestaurant.priceLabel}
                                onChange={(event) =>
                                  setEditingRestaurant({
                                    ...editingRestaurant,
                                    priceLabel: event.target.value as PriceLabel,
                                  })
                                }
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                              >
                                {PRICE_OPTIONS.map((price) => (
                                  <option key={price.label} value={price.label}>
                                    {price.label}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={editingRestaurant.isOpen ? "open" : "closed"}
                                onChange={(event) =>
                                  setEditingRestaurant({
                                    ...editingRestaurant,
                                    isOpen: event.target.value === "open",
                                  })
                                }
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                              >
                                <option value="open">
                                  {tAdmin("admin.superAdminRestaurants.open")}
                                </option>
                                <option value="closed">
                                  {tAdmin("admin.superAdminRestaurants.closed")}
                                </option>
                              </select>
                            </div>

                            <div className="rounded-xl bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                              {tAdmin("admin.superAdminRestaurants.ratingReadonly")}{" "}
                              {row.rating.toFixed(1)} ★ · {row.reviewsCount}{" "}
                              {tAdmin("admin.superAdminRestaurants.reviews")}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>{row.category}</div>
                            <div className="text-xs text-muted-foreground">{row.cuisineType}</div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {row.address}, {row.city}, {row.country}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {row.priceLabel} · {row.rating.toFixed(1)} ★ · {row.reviewsCount}{" "}
                              {tAdmin("admin.superAdminRestaurants.reviews")} ·{" "}
                              {row.isOpen
                                ? tAdmin("admin.superAdminRestaurants.open")
                                : tAdmin("admin.superAdminRestaurants.closed")}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={row.companyId ?? ""}
                            disabled={isSaving}
                            onChange={(event) => changeRestaurantCompany(row, event.target.value)}
                            className="w-fit max-w-[240px] rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">
                              {tAdmin("admin.superAdminRestaurants.noCompany")}
                            </option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>

                          {isSaving && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {tAdmin("admin.superAdminRestaurants.saving")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={row.isActive ? "active" : "inactive"}
                          disabled={isSaving}
                          onChange={(event) =>
                            changeRestaurantStatus(row, event.target.value === "active")
                          }
                          className={`w-fit rounded-full border px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            row.isActive
                              ? "border-success/30 bg-success/15 text-success"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }`}
                        >
                          <option value="active">
                            {tAdmin("admin.superAdminRestaurants.active")}
                          </option>
                          <option value="inactive">
                            {tAdmin("admin.superAdminRestaurants.inactive")}
                          </option>
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveRestaurant}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                {tAdmin("admin.superAdminRestaurants.save")}
                              </button>

                              <button
                                onClick={cancelEditingRestaurant}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                {tAdmin("admin.superAdminRestaurants.cancel")}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditingRestaurant(row)}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {tAdmin("admin.superAdminRestaurants.edit")}
                            </button>
                          )}
                        </div>
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
        {tAdmin("admin.superAdminRestaurants.note")}
      </div>
    </div>
  );
}
