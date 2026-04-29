import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Shield, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/contexts/AuthContext";
import {
  createAdminUser,
  updateAdminUserCompany,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/lib/admin-users-api";

export const Route = createFileRoute("/super-admin/users")({
  head: () => ({ meta: [{ title: "Utilisateurs — SuperAdmin LocalFood" }] }),
  component: SuperAdminUsersPage,
});

const ROLES: AppRole[] = ["superadmin", "admin", "user"];
const CLIENT_ROLES = ["admin", "user"] as const;

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
  companyId: string | null;
  companyName: string;
  isActive: boolean;
};

function SuperAdminUsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<UserRoleRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<(typeof CLIENT_ROLES)[number]>("user");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

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
  }, [loadUsers]);

  const rows = useMemo<UserListRow[]>(() => {
    const roleByUserId = new Map(roles.map((role) => [role.user_id, role.role]));
    const companyById = new Map(companies.map((company) => [company.id, company.name]));

    return profiles.map((profile) => ({
      userId: profile.user_id,
      email: profile.email ?? "Email non renseigné",
      fullName: profile.full_name ?? "Nom non renseigné",
      role: roleByUserId.get(profile.user_id) ?? "non défini",
      companyId: profile.current_company_id,
      companyName: profile.current_company_id
        ? (companyById.get(profile.current_company_id) ?? "Entreprise inconnue")
        : "Aucune entreprise",
      isActive: profile.is_active,
    }));
  }, [companies, profiles, roles]);

  const superadminCount = useMemo(
    () => rows.filter((row) => row.role === "superadmin").length,
    [rows],
  );

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

  const changeUserRole = async (row: UserListRow, nextRole: AppRole) => {
    if (row.role === nextRole) {
      return;
    }

    if (row.role === "superadmin" && superadminCount <= 1 && nextRole !== "superadmin") {
      toast.error("Impossible de retirer le dernier SuperAdmin");
      return;
    }

    setSavingUserId(row.userId);

    try {
      await updateAdminUserRole({
        userId: row.userId,
        role: nextRole,
      });

      toast.success("Rôle mis à jour", {
        description: `${row.email} est maintenant ${nextRole}.`,
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error("Impossible de modifier le rôle", {
        description:
          error instanceof Error ? error.message : "Le backend a refusé la modification.",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const changeUserCompany = async (row: UserListRow, nextCompanyId: string) => {
    const companyId = nextCompanyId || null;

    if (row.companyId === companyId) {
      return;
    }

    setSavingUserId(row.userId);

    try {
      await updateAdminUserCompany({
        userId: row.userId,
        companyId,
      });

      const companyName = companyId
        ? companies.find((company) => company.id === companyId)?.name
        : "Aucune entreprise";

      toast.success("Entreprise mise à jour", {
        description: `${row.email} → ${companyName ?? "Entreprise inconnue"}.`,
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to update user company:", error);
      toast.error("Impossible de modifier l’entreprise", {
        description:
          error instanceof Error ? error.message : "Le backend a refusé la modification.",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newUserCompanyId) {
      toast.error("Entreprise obligatoire", {
        description: "Choisissez l’entreprise à laquelle l’utilisateur sera lié.",
      });
      return;
    }

    setCreatingUser(true);

    try {
      const createdUser = await createAdminUser({
        email: newUserEmail,
        fullName: newUserFullName,
        role: newUserRole,
        companyId: newUserCompanyId,
      });

      toast.success("Utilisateur invité", {
        description: `${createdUser.email} a été lié à ${createdUser.companyName}.`,
      });

      setNewUserEmail("");
      setNewUserFullName("");
      setNewUserRole("user");
      setNewUserCompanyId("");

      await loadUsers();
    } catch (error) {
      console.error("Failed to create admin user:", error);
      toast.error("Création impossible", {
        description: error instanceof Error ? error.message : "Le backend a refusé la création.",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const changeUserStatus = async (row: UserListRow, nextIsActive: boolean) => {
    if (row.isActive === nextIsActive) {
      return;
    }

    if (row.role === "superadmin" && superadminCount <= 1 && !nextIsActive) {
      toast.error("Impossible de désactiver le dernier SuperAdmin actif");
      return;
    }

    setSavingUserId(row.userId);

    try {
      await updateAdminUserStatus({
        userId: row.userId,
        isActive: nextIsActive,
      });

      toast.success(nextIsActive ? "Utilisateur activé" : "Utilisateur désactivé", {
        description: row.email,
      });

      await loadUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Modification impossible", {
        description:
          error instanceof Error ? error.message : "Le backend a refusé la modification.",
      });
    } finally {
      setSavingUserId(null);
    }
  };

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

      <form onSubmit={handleCreateUser} className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Ajouter un utilisateur client</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Nom complet</span>
            <input
              value={newUserFullName}
              onChange={(event) => setNewUserFullName(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
              placeholder="Ex : Jean Dupont"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
              placeholder="client@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Rôle</span>
            <select
              value={newUserRole}
              onChange={(event) => setNewUserRole(event.target.value as typeof newUserRole)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
            >
              {CLIENT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Entreprise</span>
            <select
              value={newUserCompanyId}
              onChange={(event) => setNewUserCompanyId(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">Choisir une entreprise</option>
              {companies
                .filter((company) => company.is_active)
                .map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={creatingUser}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
            {creatingUser ? "Invitation..." : "Inviter l’utilisateur"}
          </button>
        </div>
      </form>

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
                {filteredRows.map((row) => {
                  const isOnlySuperadmin = row.role === "superadmin" && superadminCount <= 1;
                  const isSaving = savingUserId === row.userId;

                  return (
                    <tr key={row.userId} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <div className="font-medium">{row.fullName}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={row.role === "non défini" ? "user" : row.role}
                            disabled={isSaving || isOnlySuperadmin}
                            onChange={(event) => changeUserRole(row, event.target.value as AppRole)}
                            className="w-fit rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>

                          {isOnlySuperadmin && (
                            <span className="text-[11px] text-muted-foreground">
                              Dernier SuperAdmin
                            </span>
                          )}

                          {isSaving && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Sauvegarde...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={row.companyId ?? ""}
                          disabled={isSaving}
                          onChange={(event) => changeUserCompany(row, event.target.value)}
                          className="w-fit max-w-[220px] rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">Aucune entreprise</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.isActive
                                ? "bg-success/15 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {row.isActive ? "Actif" : "Inactif"}
                          </span>

                          <button
                            type="button"
                            disabled={
                              isSaving || (row.role === "superadmin" && superadminCount <= 1)
                            }
                            onClick={() => changeUserStatus(row, !row.isActive)}
                            className="w-fit rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {row.isActive ? "Désactiver" : "Activer"}
                          </button>
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
        Vous pouvez modifier les rôles et l’entreprise actuelle d’un utilisateur. Pour cette V1,
        changer l’entreprise remplace ses anciennes associations d’entreprise afin de garder une
        gestion simple et lisible.
      </div>
    </div>
  );
}
