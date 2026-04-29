import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Send, Wand2 } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { runMockAIQuery, SUGGESTED_PROMPTS, type AIResult } from "@/data/mockAI";
import { restaurants as localRestaurants, type Restaurant } from "@/data/restaurants";
import { fetchSupabaseRestaurants } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantsToRestaurants } from "@/lib/restaurant-mappers";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "Assistant IA — LocalFood" },
      {
        name: "description",
        content:
          "Décrivez votre envie en quelques mots, l'assistant LocalFood vous propose le restaurant idéal.",
      },
    ],
  }),
  component: AIAssistantPage,
});

function AIAssistantPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseRestaurants, setSupabaseRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsSource, setRestaurantsSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    fetchSupabaseRestaurants()
      .then((data) => {
        if (cancelled) return;

        const mapped = mapSupabaseRestaurantsToRestaurants(data);

        if (mapped.length > 0) {
          setSupabaseRestaurants(mapped);
          setRestaurantsSource("supabase");
        } else {
          setSupabaseRestaurants([]);
          setRestaurantsSource("local");
        }
      })
      .catch((error) => {
        console.error("Failed to load assistant restaurants from Supabase:", error);

        if (!cancelled) {
          setSupabaseRestaurants([]);
          setRestaurantsSource("local");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceRestaurants = useMemo(
    () =>
      restaurantsSource === "supabase" && supabaseRestaurants.length > 0
        ? supabaseRestaurants
        : localRestaurants,
    [restaurantsSource, supabaseRestaurants],
  );

  const submit = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setTimeout(() => {
      setResult(runMockAIQuery(q, sourceRestaurants));
      setLoading(false);
    }, 700);
  };

  return (
    <SiteShell>
      <section className="bg-gradient-warm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Assistant IA LocalFood
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-tight text-balance">
            Dites-nous ce dont vous avez envie.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre assistant analyse votre requête et vous propose les restaurants LocalFood qui
            correspondent vraiment à vos critères.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
            className="mt-8 bg-background rounded-2xl shadow-elevated p-2 flex gap-2 max-w-2xl mx-auto"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex : un resto date night avec parking…"
              className="flex-1 px-4 py-3 bg-transparent text-foreground outline-none text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
            >
              <Send className="h-4 w-4" /> Demander
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="rounded-full border border-border bg-background/70 backdrop-blur px-3 py-1.5 text-xs hover:border-foreground/40 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {loading && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Wand2 className="h-6 w-6 mx-auto text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground mt-3">L'assistant analyse votre requête…</p>
          </div>
        )}

        {!loading && !result && (
          <div className="rounded-3xl bg-card border border-border p-10 text-center">
            <Sparkles className="h-7 w-7 mx-auto text-primary" />
            <h2 className="mt-4 font-display text-xl font-semibold">
              Posez votre question pour commencer
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              L'assistant LocalFood ne recommande que les restaurants de notre base. Il filtre selon
              vos critères : envie, ambiance, budget, contraintes pratiques.
            </p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-soft">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shrink-0">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Vous avez demandé</p>
                  <p className="font-display text-xl font-semibold">« {query} »</p>
                  <p className="mt-3 text-foreground/90">{result.explanation}</p>
                  {result.detectedTags.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        Critères détectés
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.detectedTags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.results.length > 0 ? (
              <div>
                <h3 className="font-display text-2xl font-semibold mb-5">Recommandations</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.results.map((r) => (
                    <div key={r.id}>
                      <RestaurantCard r={r} matchScore={r.matchScore} />
                      <p className="mt-2 text-xs text-muted-foreground italic">{r.matchReason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Essayez une autre formulation. LocalFood propose actuellement{" "}
                {SUGGESTED_PROMPTS.length} exemples de recherches pour vous aider à démarrer.
              </div>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
