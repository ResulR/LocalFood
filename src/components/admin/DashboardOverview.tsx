import { Link } from "@tanstack/react-router";
import {
  Eye,
  Navigation,
  Phone,
  Heart,
  Star,
  Camera,
  MenuSquare,
  ArrowUpRight,
  MapPin,
  Sparkles,
  Bot,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { chartData7d, restaurants } from "@/data/restaurants";
import { interactions } from "@/data/mockStats";
import { TOP_AI_QUERIES } from "@/data/mockAI";

const KPIS = [
  { label: "Vues de fiche", value: "1 284", change: "+12%", icon: Eye },
  { label: "Clics Google Maps", value: "342", change: "+8%", icon: Navigation },
  { label: "Clics Waze", value: "128", change: "+4%", icon: MapPin },
  { label: "Appels", value: "86", change: "+18%", icon: Phone },
  { label: "Voir le menu", value: "421", change: "+9%", icon: MenuSquare },
  { label: "« J'y vais »", value: "152", change: "+22%", icon: Heart },
  { label: "Clics depuis IA", value: "73", change: "+31%", icon: Bot },
  { label: "Avis reçus", value: "47", change: "+6", icon: Star },
];

export function DashboardOverview() {
  const r = restaurants[0];
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bonjour, Maison Zayna 👋</h1>
        <p className="text-muted-foreground mt-1">
          Voici comment votre fiche performe ces 7 derniers jours.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map((k) => (
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
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
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
              <div className="font-display text-2xl font-semibold">{r.stats.aiAppearances}</div>
              <div className="text-[11px] text-muted-foreground">apparitions IA</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">{r.stats.aiClicks}</div>
              <div className="text-[11px] text-muted-foreground">clics IA</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Dernières interactions</h2>
          <span className="text-xs text-muted-foreground">Mises à jour il y a 2 min</span>
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
              {interactions.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-6 py-3.5 font-medium">{row.action}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{row.source}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{row.restaurant}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{row.when}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                        row.type === "AI"
                          ? "bg-primary/10 text-primary"
                          : row.type === "Offre"
                            ? "bg-success/15 text-success"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {row.type}
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
