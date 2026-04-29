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
import { topActionsBreakdown, peakHours } from "@/data/mockStats";
import { TOP_AI_QUERIES } from "@/data/mockAI";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchSupabaseRestaurantInteractionsBySlug,
  fetchSupabaseRestaurantsByCompanyId,
  type SupabaseCompanyRestaurant,
  type SupabaseRestaurantInteraction,
  type SupabaseRestaurantInteractionType,
} from "@/lib/restaurants-api";

type Range = "7d" | "30d";

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

const ACTION_LABELS: Record<SupabaseRestaurantInteractionType, string> = {
  Vue: "Vues",
  Maps: "Itinéraire Maps",
  Waze: "Itinéraire Waze",
  Appel: "Appels",
  Menu: "Voir le menu",
  Intent: "« J'y vais »",
  AI: "Assistant IA",
  Avis: "Avis",
  Offre: "Offres",
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

const FALLBACK_INTERACTIONS: SupabaseRestaurantInteraction[] = [
  {
    id: "fallback-1",
    restaurant_id: "local",
    action: "Vue de fiche",
    source: "Recherche restaurants",
    interaction_type: "Vue",
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    restaurant_id: "local",
    action: "Itinéraire lancé",
    source: "Google Maps",
    interaction_type: "Maps",
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    restaurant_id: "local",
    action: "Menu consulté",
    source: "Fiche restaurant",
    interaction_type: "Menu",
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-4",
    restaurant_id: "local",
    action: "Appel téléphonique",
    source: "Fiche restaurant",
    interaction_type: "Appel",
    created_at: new Date().toISOString(),
  },
];

function getRangeDays(range: Range) {
  return range === "7d" ? 7 : 30;
}

function isInsideRange(createdAt: string, range: Range) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= getRangeDays(range);
}

function buildChartData(interactions: SupabaseRestaurantInteraction[], range: Range): ChartRow[] {
  const days = getRangeDays(range);
  const now = new Date();

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
          ? date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")
          : String(date.getDate()),
      views,
      clics,
    };
  });
}

function buildActionBreakdown(interactions: SupabaseRestaurantInteraction[]): ActionBreakdownRow[] {
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
        l: ACTION_LABELS[type],
        v: count,
        p: Math.round((count / total) * 100),
      };
    })
    .filter((row) => row.v > 0)
    .sort((a, b) => b.v - a.v);
}

export function StatsView() {
  const { profile } = useAuth();
  const [range, setRange] = useState<Range>("7d");
  const [currentRestaurant, setCurrentRestaurant] = useState<SupabaseCompanyRestaurant | null>(
    null,
  );
  const [interactions, setInteractions] = useState<SupabaseRestaurantInteraction[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsMessage, setStatsMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      setStatsMessage("");
      setCurrentRestaurant(null);
      setInteractions([]);

      if (!profile?.current_company_id) {
        setStatsMessage("Aucune entreprise n’est liée à votre profil.");
        setLoadingStats(false);
        return;
      }

      const restaurants = await fetchSupabaseRestaurantsByCompanyId(profile.current_company_id);
      const restaurant = restaurants[0] ?? null;

      if (cancelled) return;

      if (!restaurant) {
        setStatsMessage("Aucun restaurant n’est encore lié à votre entreprise.");
        setLoadingStats(false);
        return;
      }

      setCurrentRestaurant(restaurant);

      const data = await fetchSupabaseRestaurantInteractionsBySlug(restaurant.slug);

      if (cancelled) return;

      setInteractions(data);
      setLoadingStats(false);
    }

    loadStats().catch((error) => {
      console.error("Failed to load tenant stats:", error);

      if (!cancelled) {
        setStatsMessage("Impossible de charger les statistiques.");
        setInteractions([]);
        setLoadingStats(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.current_company_id]);

  const rangeInteractions = useMemo(
    () => interactions.filter((interaction) => isInsideRange(interaction.created_at, range)),
    [interactions, range],
  );

  const data = useMemo(() => buildChartData(rangeInteractions, range), [rangeInteractions, range]);

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
    () => buildActionBreakdown(rangeInteractions),
    [rangeInteractions],
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      {loadingStats && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Chargement des statistiques...
        </div>
      )}
      {statsMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {statsMessage}
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Statistiques</h1>
          <p className="text-muted-foreground mt-1">
            Suivez l'évolution de {currentRestaurant?.name ?? "votre fiche"} dans le temps.
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
              {r === "7d" ? "7 jours" : "30 jours"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          { l: "Total vues", v: String(totalViews), c: "Fiche restaurant" },
          { l: "Clics itinéraire", v: String(itineraryClicks), c: "Maps + Waze" },
          { l: "Appels", v: String(calls), c: "Fiche restaurant" },
          { l: "Conversion", v: conversionRate, c: "J’y vais / vues" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl bg-card border border-border p-5">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="font-display text-2xl font-semibold mt-1.5">{k.v}</div>
            <div className="text-[11px] font-medium text-success mt-1">{k.c}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Vues vs interactions</h2>
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
              <Bar dataKey="views" fill="oklch(0.55 0.18 35)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="clics" fill="oklch(0.68 0.19 45)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-base font-semibold mb-4">Répartition des actions</h3>
          <div className="space-y-3">
            {(actionBreakdown.length > 0 ? actionBreakdown : topActionsBreakdown).map((row) => (
              <div key={row.l}>
                <div className="flex justify-between text-sm">
                  <span>{row.l}</span>
                  <span className="text-muted-foreground">{row.v}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${row.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-base font-semibold mb-4">Pics d'activité</h3>
          <ul className="space-y-3 text-sm">
            {peakHours.map((p) => (
              <li key={p.l} className="flex justify-between">
                <span>{p.l}</span>
                <span className="text-muted-foreground">{p.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">
            Top recherches IA ayant affiché votre restaurant
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {TOP_AI_QUERIES.map((q) => (
            <div
              key={q.q}
              className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 text-sm"
            >
              <span>« {q.q} »</span>
              <span className="text-xs text-muted-foreground">{q.count} fois</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
