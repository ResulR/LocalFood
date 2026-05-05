import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Sparkles } from "lucide-react";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchSupabaseRestaurantInteractionsBySlug,
  type SupabaseRestaurantInteraction,
  type SupabaseRestaurantInteractionType,
} from "@/lib/restaurants-api";
import { useAdminI18n, type AdminTranslationKey } from "@/lib/admin-i18n";
import type { Language } from "@/lib/i18n";

type Range = "7d" | "30d";
type TAdmin = ReturnType<typeof useAdminI18n>["tAdmin"];

type ChartRow = {
  day: string;
  views: number;
  clics: number;
};

type ActionBreakdownRow = {
  l: string;
  v: number;
  p: number;
};

const ACTION_LABEL_KEYS: Record<SupabaseRestaurantInteractionType, AdminTranslationKey> = {
  Vue: "admin.stats.actionViews",
  Maps: "admin.stats.actionMaps",
  Waze: "admin.stats.actionWaze",
  Appel: "admin.stats.actionCalls",
  Menu: "admin.stats.actionMenu",
  Intent: "admin.stats.actionIntent",
  AI: "admin.stats.actionAi",
  Avis: "admin.stats.actionReviews",
  Offre: "admin.stats.actionOffers",
};

const INTERACTION_TYPES: SupabaseRestaurantInteractionType[] = [
  "Maps",
  "Waze",
  "Appel",
  "Menu",
  "Intent",
  "AI",
  "Avis",
  "Offre",
  "Vue",
];

function getRangeDays(range: Range) {
  return range === "7d" ? 7 : 30;
}

function getChartLocale(language: Language) {
  if (language === "en") return "en-US";
  if (language === "al") return "sq-AL";
  return "fr-FR";
}

function isInsideRange(createdAt: string, range: Range) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= getRangeDays(range);
}

function buildChartData(
  interactions: SupabaseRestaurantInteraction[],
  range: Range,
  language: Language,
): ChartRow[] {
  const days = getRangeDays(range);
  const now = new Date();
  const locale = getChartLocale(language);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - index));

    const dayInteractions = interactions.filter((interaction) => {
      const interactionDate = new Date(interaction.created_at);

      return (
        interactionDate.getFullYear() === date.getFullYear() &&
        interactionDate.getMonth() === date.getMonth() &&
        interactionDate.getDate() === date.getDate()
      );
    });

    const views = dayInteractions.filter(
      (interaction) => interaction.interaction_type === "Vue",
    ).length;
    const clics = dayInteractions.filter(
      (interaction) => interaction.interaction_type !== "Vue",
    ).length;

    return {
      day:
        range === "7d"
          ? date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "")
          : String(date.getDate()),
      views,
      clics,
    };
  });
}

function buildActionBreakdown(
  interactions: SupabaseRestaurantInteraction[],
  tAdmin: TAdmin,
): ActionBreakdownRow[] {
  const actionInteractions = interactions.filter(
    (interaction) => interaction.interaction_type !== "Vue",
  );
  const total = Math.max(actionInteractions.length, 1);

  return INTERACTION_TYPES.filter((type) => type !== "Vue")
    .map((type) => {
      const count = actionInteractions.filter(
        (interaction) => interaction.interaction_type === type,
      ).length;

      return {
        l: tAdmin(ACTION_LABEL_KEYS[type]),
        v: count,
        p: Math.round((count / total) * 100),
      };
    })
    .filter((row) => row.v > 0)
    .sort((a, b) => b.v - a.v);
}

function buildPeakHours(interactions: SupabaseRestaurantInteraction[]): ActionBreakdownRow[] {
  const hourCounts = new Map<number, number>();

  interactions.forEach((interaction) => {
    const hour = new Date(interaction.created_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  });

  return Array.from(hourCounts.entries())
    .map(([hour, count]) => ({
      l: `${String(hour).padStart(2, "0")}:00 - ${String(hour + 1).padStart(2, "0")}:00`,
      v: count,
      p: 0,
    }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
}

export function StatsView() {
  const { language, tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [range, setRange] = useState<Range>("7d");
  const [interactions, setInteractions] = useState<SupabaseRestaurantInteraction[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsMessage, setStatsMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      setStatsMessage("");
      setInteractions([]);

      if (loadingRestaurants) {
        return;
      }

      if (!currentRestaurant) {
        setStatsMessage(restaurantMessage || tAdmin("admin.stats.noRestaurantSelected"));
        setLoadingStats(false);
        return;
      }

      const data = await fetchSupabaseRestaurantInteractionsBySlug(currentRestaurant.slug);

      if (cancelled) return;

      setInteractions(data);
      setLoadingStats(false);
    }

    loadStats().catch((error) => {
      console.error("Failed to load tenant stats:", error);

      if (!cancelled) {
        setStatsMessage(tAdmin("admin.stats.loadError"));
        setInteractions([]);
        setLoadingStats(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const rangeInteractions = useMemo(
    () => interactions.filter((interaction) => isInsideRange(interaction.created_at, range)),
    [interactions, range],
  );

  const data = useMemo(
    () => buildChartData(rangeInteractions, range, language),
    [rangeInteractions, range, language],
  );

  const totalViews = useMemo(
    () => rangeInteractions.filter((interaction) => interaction.interaction_type === "Vue").length,
    [rangeInteractions],
  );

  const itineraryClicks = useMemo(
    () =>
      rangeInteractions.filter(
        (interaction) =>
          interaction.interaction_type === "Maps" || interaction.interaction_type === "Waze",
      ).length,
    [rangeInteractions],
  );

  const calls = useMemo(
    () =>
      rangeInteractions.filter((interaction) => interaction.interaction_type === "Appel").length,
    [rangeInteractions],
  );

  const intentClicks = useMemo(
    () =>
      rangeInteractions.filter((interaction) => interaction.interaction_type === "Intent").length,
    [rangeInteractions],
  );

  const conversionRate =
    totalViews > 0 ? `${((intentClicks / totalViews) * 100).toFixed(1).replace(".", ",")}%` : "0%";

  const actionBreakdown = useMemo(
    () => buildActionBreakdown(rangeInteractions, tAdmin),
    [rangeInteractions, tAdmin],
  );

  const peakHourRows = useMemo(() => buildPeakHours(rangeInteractions), [rangeInteractions]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {loadingStats && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {tAdmin("admin.stats.loading")}
        </div>
      )}
      {statsMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {statsMessage}
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{tAdmin("admin.stats.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {tAdmin("admin.stats.subtitleBefore")}{" "}
            {currentRestaurant?.name ?? tAdmin("admin.stats.subtitleFallback")}{" "}
            {tAdmin("admin.stats.subtitleAfter")}
          </p>
        </div>
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm rounded-full transition ${
                range === r ? "bg-background shadow-soft font-medium" : "text-muted-foreground"
              }`}
            >
              {r === "7d" ? tAdmin("admin.stats.days7") : tAdmin("admin.stats.days30")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          {
            l: tAdmin("admin.stats.totalViews"),
            v: String(totalViews),
            c: tAdmin("admin.stats.listing"),
          },
          { l: tAdmin("admin.stats.routeClicks"), v: String(itineraryClicks), c: "Maps + Waze" },
          { l: tAdmin("admin.stats.calls"), v: String(calls), c: tAdmin("admin.stats.listing") },
          {
            l: tAdmin("admin.stats.conversion"),
            v: conversionRate,
            c: tAdmin("admin.stats.intentOverViews"),
          },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl bg-card border border-border p-5">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="font-display text-2xl font-semibold mt-1.5">{k.v}</div>
            <div className="text-[11px] font-medium text-success mt-1">{k.c}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">
          {tAdmin("admin.stats.viewsVsInteractions")}
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 70)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 70)" }}
              />
              <Legend />
              <Bar
                dataKey="views"
                name={tAdmin("admin.stats.views")}
                fill="oklch(0.55 0.18 35)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="clics"
                name={tAdmin("admin.stats.clicks")}
                fill="oklch(0.68 0.19 45)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-base font-semibold mb-4">
            {tAdmin("admin.stats.actionBreakdown")}
          </h3>
          <div className="space-y-3">
            {actionBreakdown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tAdmin("admin.stats.noActions")}
              </div>
            ) : (
              actionBreakdown.map((row) => (
                <div key={row.l}>
                  <div className="flex justify-between text-sm">
                    <span>{row.l}</span>
                    <span className="text-muted-foreground">{row.v}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${row.p}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-base font-semibold mb-4">
            {tAdmin("admin.stats.peakHours")}
          </h3>

          {peakHourRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {tAdmin("admin.stats.noPeaks")}
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              {peakHourRows.map((p) => (
                <li key={p.l} className="flex justify-between">
                  <span>{p.l}</span>
                  <span className="text-muted-foreground">{p.v}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">
            {tAdmin("admin.stats.topAiSearches")}
          </h3>
        </div>

        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tAdmin("admin.stats.noAiData")}
        </div>
      </div>
    </div>
  );
}
