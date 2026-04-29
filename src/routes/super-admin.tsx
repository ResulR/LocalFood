import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Loader2, LogOut, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "SuperAdmin — LocalFood" }] }),
  component: SuperAdminLayout,
});

const NAV = [
  {
    to: "/super-admin/users",
    label: "Utilisateurs",
    icon: Users,
  },
];

function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-4 text-sm text-muted-foreground shadow-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de l’espace SuperAdmin...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role !== "superadmin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="max-w-md rounded-3xl border border-border bg-background p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Accès refusé</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Cette section est réservée aux SuperAdmins LocalFood.
          </p>
          <Link
            to="/restaurant-dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="font-display font-semibold">SuperAdmin</div>
            <div className="text-[11px] text-muted-foreground">LocalFood</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to as "/"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <Link
            to="/restaurant-dashboard"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour dashboard
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border flex items-center justify-between px-4 sm:px-6 gap-4">
          <div>
            <div className="text-sm font-semibold">Espace SuperAdmin</div>
            <div className="text-xs text-muted-foreground">Gestion globale LocalFood</div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </header>

        <div className="p-4 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
