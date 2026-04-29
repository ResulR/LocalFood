import { useState } from "react";
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
import { chartData7d, chartData30d } from "@/data/restaurants";
import { topActionsBreakdown, peakHours } from "@/data/mockStats";
import { TOP_AI_QUERIES } from "@/data/mockAI";
import { Sparkles } from "lucide-react";

export function StatsView() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const data = range === "7d" ? chartData7d : chartData30d;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Statistiques</h1>
          <p className="text-muted-foreground mt-1">
            Suivez l'évolution de votre fiche dans le temps.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm rounded-full transition ${range === r ? "bg-background shadow-soft font-medium" : "text-muted-foreground"}`}
            >
              {r === "7d" ? "7 jours" : "30 jours"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          { l: "Total vues", v: range === "7d" ? "409" : "1 752", c: "+14%" },
          { l: "Clics itinéraire", v: range === "7d" ? "169" : "612", c: "+9%" },
          { l: "Appels", v: range === "7d" ? "32" : "127", c: "+22%" },
          { l: "Conversion", v: "12,4%", c: "+1,8 pt" },
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
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
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
            {topActionsBreakdown.map((row) => (
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
