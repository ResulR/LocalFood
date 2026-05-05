import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Edit3, Loader2, Plus, Save, Search, Shield, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAdminI18n } from "@/lib/admin-i18n";

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

type EditingCompany = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildUniqueSlug(name: string, existingSlugs: string[]) {
  const baseSlug = normalizeSlug(name) || "entreprise";
  const usedSlugs = new Set(existingSlugs);

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 1;
  let nextSlug = `${baseSlug}-${String(index).padStart(2, "0")}`;

  while (usedSlugs.has(nextSlug)) {
    index += 1;
    nextSlug = `${baseSlug}-${String(index).padStart(2, "0")}`;
  }

  return nextSlug;
}

function SuperAdminCompaniesPage() {
  const { tAdmin } = useAdminI18n();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUserRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<EditingCompany | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");

  const loadCompanies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadCompanies().catch((error) => {
      console.error("Failed to load super admin companies:", error);

      if (!cancelled) {
        setErrorMessage(tAdmin("admin.superAdminCompanies.loadError"));
        setLoadingCompanies(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadCompanies, tAdmin]);

  const rows = useMemo<CompanyListRow[]>(() => {
    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description ?? tAdmin("admin.superAdminCompanies.noDescription"),
      isActive: company.is_active,
      restaurantsCount: restaurants.filter((restaurant) => restaurant.company_id === company.id)
        .length,
      usersCount: companyUsers.filter((membership) => membership.company_id === company.id).length,
    }));
  }, [companies, companyUsers, restaurants, tAdmin]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [row.name, row.slug, row.description].join(" ").toLowerCase().includes(normalizedSearch),
    );
  }, [rows, search]);

  const createCompany = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = newCompanyName.trim();
    const description = newCompanyDescription.trim();

    if (!name) {
      toast.error(tAdmin("admin.superAdminCompanies.nameRequired"));
      return;
    }

    setCreatingCompany(true);

    const slug = buildUniqueSlug(
      name,
      companies.map((company) => company.slug),
    );

    const { error } = await supabase.from("companies").insert({
      name,
      slug,
      description: description || null,
      is_active: true,
    });

    if (error) {
      setCreatingCompany(false);
      toast.error(tAdmin("admin.superAdminCompanies.createError"), { description: error.message });
      return;
    }

    toast.success(tAdmin("admin.superAdminCompanies.created"), {
      description: `${name} ${tAdmin("admin.superAdminCompanies.addedToLocalFood")}`,
    });

    setNewCompanyName("");
    setNewCompanyDescription("");
    setCreatingCompany(false);
    await loadCompanies();
  };

  const startEditingCompany = (row: CompanyListRow) => {
    setEditingCompany({
      id: row.id,
      name: row.name,
      description:
        row.description === tAdmin("admin.superAdminCompanies.noDescription")
          ? ""
          : row.description,
      isActive: row.isActive,
    });
  };

  const cancelEditingCompany = () => {
    setEditingCompany(null);
  };

  const saveCompany = async () => {
    if (!editingCompany) {
      return;
    }

    const name = editingCompany.name.trim();
    const description = editingCompany.description.trim();

    if (!name) {
      toast.error(tAdmin("admin.superAdminCompanies.nameRequired"));
      return;
    }

    setSavingCompanyId(editingCompany.id);

    const { error } = await supabase
      .from("companies")
      .update({
        name,
        description: description || null,
        is_active: editingCompany.isActive,
      })
      .eq("id", editingCompany.id);

    if (error) {
      setSavingCompanyId(null);
      toast.error(tAdmin("admin.superAdminCompanies.updateError"), { description: error.message });
      return;
    }

    toast.success(tAdmin("admin.superAdminCompanies.updated"), {
      description: `${name} ${tAdmin("admin.superAdminCompanies.updatedDescription")}`,
    });

    setEditingCompany(null);
    setSavingCompanyId(null);
    await loadCompanies();
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
            {tAdmin("admin.superAdminCompanies.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tAdmin("admin.superAdminCompanies.subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">
            {tAdmin("admin.superAdminCompanies.total")}
          </div>
          <div className="font-display text-2xl font-semibold">{rows.length}</div>
        </div>
      </div>

      <form onSubmit={createCompany} className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">
            {tAdmin("admin.superAdminCompanies.add")}
          </h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
          <div>
            <label htmlFor="company-name" className="text-xs font-medium text-muted-foreground">
              {tAdmin("admin.superAdminCompanies.name")}
            </label>
            <input
              id="company-name"
              value={newCompanyName}
              onChange={(event) => setNewCompanyName(event.target.value)}
              placeholder={tAdmin("admin.superAdminCompanies.namePlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
            />
          </div>

          <div>
            <label
              htmlFor="company-description"
              className="text-xs font-medium text-muted-foreground"
            >
              {tAdmin("admin.superAdminCompanies.optionalDescription")}
            </label>
            <input
              id="company-description"
              value={newCompanyDescription}
              onChange={(event) => setNewCompanyDescription(event.target.value)}
              placeholder={tAdmin("admin.superAdminCompanies.descriptionPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingCompany}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {creatingCompany ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tAdmin("admin.superAdminCompanies.creating")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {tAdmin("admin.superAdminCompanies.addButton")}
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {tAdmin("admin.superAdminCompanies.slugHelp")}
        </p>
      </form>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tAdmin("admin.superAdminCompanies.searchPlaceholder")}
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {loadingCompanies && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tAdmin("admin.superAdminCompanies.loading")}
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
          <p className="mt-3 text-sm text-muted-foreground">
            {tAdmin("admin.superAdminCompanies.empty")}
          </p>
        </div>
      )}

      {!loadingCompanies && !errorMessage && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminCompanies.company")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminCompanies.slug")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminCompanies.restaurants")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminCompanies.users")}
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    {tAdmin("admin.superAdminCompanies.status")}
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    {tAdmin("admin.superAdminCompanies.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isEditing = editingCompany?.id === row.id;
                  const isSaving = savingCompanyId === row.id;

                  return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editingCompany.name}
                              onChange={(event) =>
                                setEditingCompany({
                                  ...editingCompany,
                                  name: event.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                            />
                            <input
                              value={editingCompany.description}
                              onChange={(event) =>
                                setEditingCompany({
                                  ...editingCompany,
                                  description: event.target.value,
                                })
                              }
                              placeholder={tAdmin("admin.superAdminCompanies.optionalDescription")}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{row.name}</div>
                            <div className="max-w-sm truncate text-xs text-muted-foreground">
                              {row.description}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">{row.slug}</td>
                      <td className="px-5 py-4 font-medium">{row.restaurantsCount}</td>
                      <td className="px-5 py-4 font-medium">{row.usersCount}</td>

                      <td className="px-5 py-4">
                        {isEditing ? (
                          <select
                            value={editingCompany.isActive ? "active" : "inactive"}
                            onChange={(event) =>
                              setEditingCompany({
                                ...editingCompany,
                                isActive: event.target.value === "active",
                              })
                            }
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none"
                          >
                            <option value="active">
                              {tAdmin("admin.superAdminCompanies.active")}
                            </option>
                            <option value="inactive">
                              {tAdmin("admin.superAdminCompanies.inactive")}
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.isActive
                                ? "bg-success/15 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {row.isActive
                              ? tAdmin("admin.superAdminCompanies.active")
                              : tAdmin("admin.superAdminCompanies.inactive")}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveCompany}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                {tAdmin("admin.superAdminCompanies.save")}
                              </button>

                              <button
                                onClick={cancelEditingCompany}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                {tAdmin("admin.superAdminCompanies.cancel")}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditingCompany(row)}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {tAdmin("admin.superAdminCompanies.edit")}
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
        {tAdmin("admin.superAdminCompanies.note")}
      </div>
    </div>
  );
}
