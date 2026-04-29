import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Eye,
  Navigation,
  Phone,
  Heart,
  Star,
  MenuSquare,
  ArrowUpRight,
  MapPin,
  Sparkles,
  Bot,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { interactions as localInteractions } from "@/data/mockStats";
import { TOP_AI_QUERIES } from "@/data/mockAI";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchSupabaseRestaurantInteractionsBySlug,
  type SupabaseRestaurantInteraction,
  type SupabaseRestaurantInteractionType,
} from "@/lib/restaurants-api";

type KpiItem = {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ChartRow = {
  day: string;
  views: number;
  clics: number;
};

const FALLBACK_INTERACTIONS: SupabaseRestaurantInteraction[] = [
  {
    id: "fallback-view",
    restaurant_id: "local",
    action: "Vue de fiche",
    source: "Recherche restaurants",
    interaction_type: "Vue",
    created_at: new Date().toISOString(),
  },
  ...localInteractions.map((interaction, index) => ({
    id: `fallback-${interaction.id}`,
    restaurant_id: "local",
    action: interaction.action,
    source: interaction.source,
    interaction_type: interaction.type as SupabaseRestaurantInteractionType,
    created_at: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
  })),
];

const SOURCE_LABELS: Record<string, string> = {
  public_card: "Carte restaurant",
  public_detail: "Fiche restaurant",
  ai_assistant: "Assistant IA",
  dashboard_seed: "Données initiales",
};

function formatInteractionSource(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

function formatWhen(createdAt: string) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "À l’instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return "Il y a 1 jour";
  return `Il y a ${diffDays} jours`;
}

function buildChartData(interactions: SupabaseRestaurantInteraction[]): ChartRow[] {
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));

    const dayInteractions = interactions.filter((interaction) => {
      const interactionDate = new Date(interaction.created_at);

      return (
        interactionDate.getFullYear() === date.getFullYear() &&
        interactionDate.getMonth() === date.getMonth() &&
        interactionDate.getDate() === date.getDate()
      );
    });

    return {
      day: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      views: dayInteractions.filter((interaction) => interaction.interaction_type === "Vue").length,
      clics: dayInteractions.filter((interaction) => interaction.interaction_type !== "Vue").length,
    };
  });
}

function countType(
  interactions: SupabaseRestaurantInteraction[],
  type: SupabaseRestaurantInteractionType,
) {
  return interactions.filter((interaction) => interaction.interaction_type === type).length;
}

export function DashboardOverview() {
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [interactions, setInteractions] = useState<SupabaseRestaurantInteraction[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardMessage, setDashboardMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoadingDashboard(true);
      setDashboardMessage("");
      setInteractions([]);

      if (loadingRestaurants) {
        return;
      }

      if (!currentRestaurant) {
        setDashboardMessage(restaurantMessage || "Aucun restaurant n’est sélectionné.");
        setLoadingDashboard(false);
        return;
      }

      const data = await fetchSupabaseRestaurantInteractionsBySlug(currentRestaurant.slug);

      if (cancelled) return;

      setInteractions(data);
      setLoadingDashboard(false);
    }

    loadDashboard().catch((error) => {
      console.error("Failed to load tenant dashboard:", error);

      if (!cancelled) {
        setDashboardMessage("Impossible de charger les données du dashboard.");
        setInteractions([]);
        setLoadingDashboard(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage]);

  const last7dInteractions = useMemo(() => {
    const now = new Date();

    return interactions.filter((interaction) => {
      const createdDate = new Date(interaction.created_at);
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays <= 7;
    });
  }, [interactions]);

  const chartData7d = useMemo(() => buildChartData(last7dInteractions), [last7dInteractions]);

  const views = countType(last7dInteractions, "Vue");
  const maps = countType(last7dInteractions, "Maps");
  const waze = countType(last7dInteractions, "Waze");
  const calls = countType(last7dInteractions, "Appel");
  const menu = countType(last7dInteractions, "Menu");
  const intent = countType(last7dInteractions, "Intent");
  const ai = countType(last7dInteractions, "AI");
  const reviews = countType(last7dInteractions, "Avis");
  const offers = countType(last7dInteractions, "Offre");

  const kpis: KpiItem[] = [
    { label: "Vues de fiche", value: String(views), change: "7 jours", icon: Eye },
    { label: "Clics Google Maps", value: String(maps), change: "7 jours", icon: Navigation },
    { label: "Clics Waze", value: String(waze), change: "7 jours", icon: MapPin },
    { label: "Appels", value: String(calls), change: "7 jours", icon: Phone },
    { label: "Voir le menu", value: String(menu), change: "7 jours", icon: MenuSquare },
    { label: "« J'y vais »", value: String(intent), change: "Conversion", icon: Heart },
    { label: "Clics depuis IA", value: String(ai), change: "Assistant", icon: Bot },
    { label: "Avis reçus", value: String(reviews), change: `${offers} offre(s)`, icon: Star },
  ];

  const recentInteractions = interactions.slice(0, 8);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {loadingDashboard && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Chargement de la vue d’ensemble...
        </div>
      )}
      {dashboardMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {dashboardMessage}
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold">
          Bonjour, {currentRestaurant?.name ?? "restaurateur"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Voici comment votre fiche performe ces 7 derniers jours.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl bg-card border border-border p-5 hover:shadow-soft transition"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <k.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-success bg-success/10 rounded-full px-2 py-0.5">
                {k.change}
              </span>
            </div>
            <div className="mt-4 font-display text-2xl font-semibold">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Vues & interactions</h2>
              <p className="text-xs text-muted-foreground">7 derniers jours</p>
            </div>
            <Link
              to="/restaurant-dashboard/statistiques"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData7d}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.18 35)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.55 0.18 35)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.01 70)"
                  vertical={false}
                />
                <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 70)" }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="oklch(0.55 0.18 35)"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
                <Line
                  type="monotone"
                  dataKey="clics"
                  stroke="oklch(0.62 0.13 155)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Performance Assistant IA</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Top recherches IA ayant affiché votre restaurant
          </p>
          <ul className="space-y-3">
            {TOP_AI_QUERIES.slice(0, 5).map((q) => (
              <li key={q.q} className="flex items-center justify-between text-sm">
                <span className="text-foreground/90">« {q.q} »</span>
                <span className="text-xs text-muted-foreground">{q.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-display text-2xl font-semibold">{ai}</div>
              <div className="text-[11px] text-muted-foreground">apparitions IA</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">{ai}</div>
              <div className="text-[11px] text-muted-foreground">clics IA</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Dernières interactions</h2>
          <span className="text-xs text-muted-foreground">Mises à jour récentes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-y border-border bg-secondary/40">
              <tr>
                <th className="text-left font-medium px-6 py-3">Action</th>
                <th className="text-left font-medium px-6 py-3">Source</th>
                <th className="text-left font-medium px-6 py-3">Restaurant</th>
                <th className="text-left font-medium px-6 py-3">Quand</th>
                <th className="text-right font-medium px-6 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentInteractions.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-6 py-3.5 font-medium">{row.action}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {formatInteractionSource(row.source)}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {currentRestaurant?.name ?? "Restaurant"}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {formatWhen(row.created_at)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                        row.interaction_type === "AI"
                          ? "bg-primary/10 text-primary"
                          : row.interaction_type === "Offre"
                            ? "bg-success/15 text-success"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {row.interaction_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
