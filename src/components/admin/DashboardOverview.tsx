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
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchApiRestaurantInteractionsBySlug,
  type ApiRestaurantInteraction,
  type ApiRestaurantInteractionType,
} from "@/lib/restaurants-api";
import { useAdminI18n } from "@/lib/admin-i18n";
import type { Language } from "@/lib/i18n";

type TAdmin = ReturnType<typeof useAdminI18n>["tAdmin"];

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

function formatInteractionSource(source: string, tAdmin: TAdmin) {
  const sourceLabels: Record<string, string> = {
    public_card: tAdmin("admin.overview.sourcePublicCard"),
    public_detail: tAdmin("admin.overview.sourcePublicDetail"),
    ai_assistant: tAdmin("admin.overview.sourceAiAssistant"),
    dashboard_seed: tAdmin("admin.overview.sourceDashboardSeed"),
  };

  return sourceLabels[source] ?? source;
}

function formatInteractionType(type: ApiRestaurantInteractionType, tAdmin: TAdmin) {
  const typeLabels: Record<ApiRestaurantInteractionType, string> = {
    Vue: tAdmin("admin.overview.typeView"),
    Maps: tAdmin("admin.overview.typeMaps"),
    Waze: tAdmin("admin.overview.typeWaze"),
    Appel: tAdmin("admin.overview.typeCall"),
    Menu: tAdmin("admin.overview.typeMenu"),
    Intent: tAdmin("admin.overview.typeIntent"),
    AI: tAdmin("admin.overview.typeAi"),
    Avis: tAdmin("admin.overview.typeReview"),
    Offre: tAdmin("admin.overview.typeOffer"),
  };

  return typeLabels[type] ?? type;
}

function formatWhen(createdAt: string, tAdmin: TAdmin) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return tAdmin("admin.overview.justNow");
  if (diffMinutes < 60) {
    return `${tAdmin("admin.overview.ago")} ${diffMinutes} ${tAdmin("admin.overview.minuteShort")}`;
  }
  if (diffHours < 24) {
    return `${tAdmin("admin.overview.ago")} ${diffHours} ${tAdmin("admin.overview.hourShort")}`;
  }
  if (diffDays === 1) return tAdmin("admin.overview.oneDayAgo");

  return `${tAdmin("admin.overview.ago")} ${diffDays} ${tAdmin("admin.overview.daysAgo")}`;
}

function getChartLocale(language: Language) {
  if (language === "en") return "en-US";
  if (language === "al") return "sq-AL";
  return "fr-FR";
}

function buildChartData(
  interactions: ApiRestaurantInteraction[],
  language: Language,
): ChartRow[] {
  const now = new Date();
  const locale = getChartLocale(language);

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
      day: date.toLocaleDateString(locale, { weekday: "short" }).replace(".", ""),
      views: dayInteractions.filter((interaction) => interaction.interaction_type === "Vue").length,
      clics: dayInteractions.filter((interaction) => interaction.interaction_type !== "Vue").length,
    };
  });
}

function countType(
  interactions: ApiRestaurantInteraction[],
  type: ApiRestaurantInteractionType,
) {
  return interactions.filter((interaction) => interaction.interaction_type === type).length;
}

export function DashboardOverview() {
  const { language, tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [interactions, setInteractions] = useState<ApiRestaurantInteraction[]>([]);
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
        setDashboardMessage(restaurantMessage || tAdmin("admin.overview.noRestaurantSelected"));
        setLoadingDashboard(false);
        return;
      }

      const data = await fetchApiRestaurantInteractionsBySlug(currentRestaurant.slug);

      if (cancelled) return;

      setInteractions(data);
      setLoadingDashboard(false);
    }

    loadDashboard().catch((error) => {
      console.error("Failed to load tenant dashboard:", error);

      if (!cancelled) {
        setDashboardMessage(tAdmin("admin.overview.loadError"));
        setInteractions([]);
        setLoadingDashboard(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const last7dInteractions = useMemo(() => {
    const now = new Date();

    return interactions.filter((interaction) => {
      const createdDate = new Date(interaction.created_at);
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays <= 7;
    });
  }, [interactions]);

  const chartData7d = useMemo(
    () => buildChartData(last7dInteractions, language),
    [last7dInteractions, language],
  );

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
    {
      label: tAdmin("admin.overview.kpiViews"),
      value: String(views),
      change: tAdmin("admin.common.days7"),
      icon: Eye,
    },
    {
      label: tAdmin("admin.overview.kpiMaps"),
      value: String(maps),
      change: tAdmin("admin.common.days7"),
      icon: Navigation,
    },
    {
      label: tAdmin("admin.overview.kpiWaze"),
      value: String(waze),
      change: tAdmin("admin.common.days7"),
      icon: MapPin,
    },
    {
      label: tAdmin("admin.overview.kpiCalls"),
      value: String(calls),
      change: tAdmin("admin.common.days7"),
      icon: Phone,
    },
    {
      label: tAdmin("admin.overview.kpiMenu"),
      value: String(menu),
      change: tAdmin("admin.common.days7"),
      icon: MenuSquare,
    },
    {
      label: tAdmin("admin.overview.kpiIntent"),
      value: String(intent),
      change: tAdmin("admin.overview.conversion"),
      icon: Heart,
    },
    {
      label: tAdmin("admin.overview.kpiAi"),
      value: String(ai),
      change: tAdmin("admin.overview.assistant"),
      icon: Bot,
    },
    {
      label: tAdmin("admin.overview.kpiReviews"),
      value: String(reviews),
      change: `${offers} ${tAdmin("admin.overview.offers")}`,
      icon: Star,
    },
  ];

  const recentInteractions = interactions.slice(0, 8);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {loadingDashboard && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {tAdmin("admin.overview.loadingOverview")}
        </div>
      )}
      {dashboardMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {dashboardMessage}
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold">
          {tAdmin("admin.overview.hello")},{" "}
          {currentRestaurant?.name ?? tAdmin("admin.overview.ownerFallback")} 👋
        </h1>
        <p className="text-muted-foreground mt-1">{tAdmin("admin.overview.subtitle")}</p>
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
              <h2 className="font-display text-lg font-semibold">
                {tAdmin("admin.overview.viewsInteractions")}
              </h2>
              <p className="text-xs text-muted-foreground">{tAdmin("admin.common.days7")}</p>
            </div>
            <Link
              to="/restaurant-dashboard/statistiques"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              {tAdmin("admin.overview.seeAll")} <ArrowUpRight className="h-3 w-3" />
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
                  name={tAdmin("admin.overview.chartViews")}
                  stroke="oklch(0.55 0.18 35)"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
                <Line
                  type="monotone"
                  dataKey="clics"
                  name={tAdmin("admin.overview.chartClicks")}
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
            <h2 className="font-display text-lg font-semibold">
              {tAdmin("admin.overview.aiPerformance")}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {tAdmin("admin.overview.aiDescription")}
          </p>

          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {tAdmin("admin.overview.noAiData")}
          </div>

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-display text-2xl font-semibold">{ai}</div>
              <div className="text-[11px] text-muted-foreground">
                {tAdmin("admin.overview.aiInteractions")}
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">{ai}</div>
              <div className="text-[11px] text-muted-foreground">
                {tAdmin("admin.overview.aiClicks")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {tAdmin("admin.overview.latestInteractions")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {tAdmin("admin.overview.recentUpdates")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-y border-border bg-secondary/40">
              <tr>
                <th className="text-left font-medium px-6 py-3">
                  {tAdmin("admin.overview.action")}
                </th>
                <th className="text-left font-medium px-6 py-3">
                  {tAdmin("admin.overview.source")}
                </th>
                <th className="text-left font-medium px-6 py-3">
                  {tAdmin("admin.common.restaurant")}
                </th>
                <th className="text-left font-medium px-6 py-3">{tAdmin("admin.overview.when")}</th>
                <th className="text-right font-medium px-6 py-3">
                  {tAdmin("admin.overview.type")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInteractions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {tAdmin("admin.overview.noInteractions")}
                  </td>
                </tr>
              ) : (
                recentInteractions.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-6 py-3.5 font-medium">{row.action}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {formatInteractionSource(row.source, tAdmin)}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {currentRestaurant?.name ?? tAdmin("admin.common.restaurant")}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {formatWhen(row.created_at, tAdmin)}
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
                        {formatInteractionType(row.interaction_type, tAdmin)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
