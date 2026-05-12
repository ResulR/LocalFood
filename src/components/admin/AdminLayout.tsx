import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Star,
  Images,
  BadgePercent,
  Clock,
  UtensilsCrossed,
  Bell,
  Search,
  ArrowLeft,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import { ChangePasswordDialog } from "@/components/admin/ChangePasswordDialog";
import { useAdminI18n } from "@/lib/admin-i18n";

type NavItem = {
  to: string;
  labelKey:
    | "admin.layout.overview"
    | "admin.layout.profile"
    | "admin.layout.openingHours"
    | "admin.layout.offers"
    | "admin.layout.statistics"
    | "admin.layout.reviews"
    | "admin.layout.photos";
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  {
    to: "/restaurant-dashboard",
    labelKey: "admin.layout.overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { to: "/restaurant-dashboard/profile", labelKey: "admin.layout.profile", icon: Store },
  { to: "/restaurant-dashboard/horaires", labelKey: "admin.layout.openingHours", icon: Clock },
  { to: "/restaurant-dashboard/offres", labelKey: "admin.layout.offers", icon: BadgePercent },
  { to: "/restaurant-dashboard/stats", labelKey: "admin.layout.statistics", icon: BarChart3 },
  { to: "/restaurant-dashboard/reviews", labelKey: "admin.layout.reviews", icon: Star },
  { to: "/restaurant-dashboard/photos", labelKey: "admin.layout.photos", icon: Images },
];

export function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const { tAdmin } = useAdminI18n();
  const forcePasswordChange =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("forcePasswordChange") === "1";
  const {
    restaurants,
    selectedRestaurant,
    selectedRestaurantId,
    loadingRestaurants,
    restaurantMessage,
    setSelectedRestaurantId,
  } = useRestaurantDashboard();

  const restaurantName =
    selectedRestaurant?.name ??
    (loadingRestaurants
      ? tAdmin("admin.common.loading")
      : restaurantMessage || tAdmin("admin.layout.proArea"));

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="font-display font-semibold">LocalFood</div>
            <div className="text-[11px] text-muted-foreground">
              {tAdmin("admin.layout.ownerArea")}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
              >
                <item.icon className="h-4 w-4" /> {tAdmin(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-3">
          {role === "superadmin" && (
            <Link
              to="/super-admin/users"
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80"
            >
              <Shield className="h-3.5 w-3.5" /> {tAdmin("admin.common.superAdmin")}
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {tAdmin("admin.layout.backToSite")}
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border flex items-center px-4 sm:px-6 gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder={tAdmin("admin.layout.search")}
              className="w-full rounded-full bg-secondary border border-transparent focus:border-ring focus:bg-background pl-9 pr-4 h-9 text-sm outline-none transition"
            />
          </div>
          <button className="relative h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </button>
          {restaurants.length > 1 && selectedRestaurantId && (
            <select
              value={selectedRestaurantId}
              onChange={(event) => setSelectedRestaurantId(event.target.value)}
              className="hidden md:block max-w-52 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-ring"
              aria-label={tAdmin("admin.layout.chooseRestaurant")}
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold">
              {restaurantName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <div className="font-medium">{restaurantName}</div>
              <div className="text-muted-foreground">{tAdmin("admin.layout.proArea")}</div>
            </div>
          </div>

          <ChangePasswordDialog
            forceOpen={forcePasswordChange}
            onPasswordChanged={() => {
              navigate({ to: "/restaurant-dashboard" });
            }}
          />

          <button
            onClick={handleSignOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
            title={tAdmin("admin.layout.signOut")}
            aria-label={tAdmin("admin.layout.signOut")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <div className="p-4 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
