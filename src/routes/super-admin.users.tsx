import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Shield, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/contexts/AuthContext";

export const Route = createFileRoute("/super-admin/users")({
  head: () => ({ meta: [{ title: "Utilisateurs — SuperAdmin LocalFood" }] }),
  component: SuperAdminUsersPage,
});

type ProfileRow = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

type UserRoleRow = {
  user_id: string;
  role: AppRole;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type UserListRow = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole | "non défini";
  companyName: string;
  isActive: boolean;
};

function SuperAdminUsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<UserRoleRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoadingUsers(true);
      setErrorMessage("");

      const [profilesResult, rolesResult, companiesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, email, full_name, is_active, current_company_id")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("companies").select("id, name, slug, is_active").order("name"),
      ]);

      if (cancelled) {
        return;
      }

      if (profilesResult.error) {
        setErrorMessage(profilesResult.error.message);
        setLoadingUsers(false);
        return;
      }

      if (rolesResult.error) {
        setErrorMessage(rolesResult.error.message);
        setLoadingUsers(false);
        return;
      }

      if (companiesResult.error) {
        setErrorMessage(companiesResult.error.message);
        setLoadingUsers(false);
        return;
      }

      setProfiles((profilesResult.data ?? []) as ProfileRow[]);
      setRoles((rolesResult.data ?? []) as UserRoleRow[]);
      setCompanies((companiesResult.data ?? []) as CompanyRow[]);
      setLoadingUsers(false);
    }

    loadUsers().catch((error) => {
      console.error("Failed to load super admin users:", error);

      if (!cancelled) {
        setErrorMessage("Impossible de charger les utilisateurs.");
        setLoadingUsers(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<UserListRow[]>(() => {
    const roleByUserId = new Map(roles.map((role) => [role.user_id, role.role]));
    const companyById = new Map(companies.map((company) => [company.id, company.name]));

    return profiles.map((profile) => ({
      userId: profile.user_id,
      email: profile.email ?? "Email non renseigné",
      fullName: profile.full_name ?? "Nom non renseigné",
      role: roleByUserId.get(profile.user_id) ?? "non défini",
      companyName: profile.current_company_id
        ? (companyById.get(profile.current_company_id) ?? "Entreprise inconnue")
        : "Aucune entreprise",
      isActive: profile.is_active,
    }));
  }, [companies, profiles, roles]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [row.email, row.fullName, row.role, row.companyName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
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
          <h1 className="mt-1 font-display text-3xl font-semibold">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue globale des comptes LocalFood, rôles et entreprises liées.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">Total utilisateurs</div>
          <div className="font-display text-2xl font-semibold">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par email, nom, rôle, entreprise..."
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {loadingUsers && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des utilisateurs...
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {!loadingUsers && !errorMessage && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        </div>
      )}

      {!loadingUsers && !errorMessage && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Utilisateur</th>
                  <th className="px-5 py-3 text-left font-medium">Rôle</th>
                  <th className="px-5 py-3 text-left font-medium">Entreprise actuelle</th>
                  <th className="px-5 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.userId} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-medium">{row.fullName}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{row.companyName}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
        Cette première version affiche les utilisateurs uniquement. L’ajout d’utilisateur, le
        changement de rôle et l’assignation d’entreprise seront ajoutés étape par étape après
        validation de cette base.
      </div>
    </div>
  );
}
