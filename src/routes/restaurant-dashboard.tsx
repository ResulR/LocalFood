import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { RestaurantDashboardProvider } from "@/contexts/RestaurantDashboardContext";

export const Route = createFileRoute("/restaurant-dashboard")({
  head: () => ({ meta: [{ title: "Espace restaurateur — LocalFood" }] }),
  component: ProtectedRestaurantDashboard,
});

function ProtectedRestaurantDashboard() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-4 text-sm text-muted-foreground shadow-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de votre espace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="max-w-md rounded-3xl border border-border bg-background p-8 text-center shadow-soft">
          <h1 className="font-display text-2xl font-semibold">Accès non configuré</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Votre compte existe, mais aucun rôle LocalFood ne lui est encore associé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantDashboardProvider>
      <AdminLayout />
    </RestaurantDashboardProvider>
  );
}
