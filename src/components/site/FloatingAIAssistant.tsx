import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Minus, Send, ArrowUpRight } from "lucide-react";
import { runMockAIQuery, SUGGESTED_PROMPTS, type AIResult } from "@/data/mockAI";
import { restaurants as localRestaurants, type Restaurant } from "@/data/restaurants";
import { fetchSupabaseRestaurants } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantsToRestaurants } from "@/lib/restaurant-mappers";

/**
 * FloatingAIAssistant
 * Petit widget IA flottant en bas à gauche, discret et premium.
 * - Bouton rond fixed bottom-left
 * - Au clic : ouvre un panneau de chat compact
 * - Mockée : utilise runMockAIQuery (aucune API)
 */
export function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [supabaseRestaurants, setSupabaseRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsSource, setRestaurantsSource] = useState<"supabase" | "local">("local");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

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
        console.error("Failed to load floating assistant restaurants from Supabase:", error);

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

  function submit(q: string) {
    const value = q.trim();
    if (!value) return;
    setQuery(value);
    setResult(runMockAIQuery(value, sourceRestaurants));
  }

  return (
    <>
      {/* Panneau de chat */}
      {open && (
        <div
          role="dialog"
          aria-label="Assistant LocalFood"
          className="fixed z-40 bg-background border border-border shadow-elevated rounded-2xl flex flex-col overflow-hidden
                     bottom-[92px] left-4 right-4 max-h-[70vh]
                     sm:left-6 sm:right-auto sm:bottom-[96px] sm:w-[380px] sm:max-h-[520px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold leading-tight">
                  Assistant LocalFood
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate">
                  Décris ce que tu cherches, je te propose les meilleurs restos.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                aria-label="Réduire"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setResult(null);
                  setQuery("");
                }}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!result && (
              <>
                <p className="text-xs text-muted-foreground">Quelques idées pour commencer :</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Resto date night avec parking",
                    "Snack halal pas cher",
                    "Brunch avec terrasse",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-secondary transition text-foreground/80"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-muted-foreground mb-1.5">Ou plus :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary transition text-muted-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {result && (
              <div className="space-y-3">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Ta demande
                  </div>
                  <div className="text-sm">{query}</div>
                  {result.detectedTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.detectedTags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-foreground/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{result.explanation}</p>
                <div className="space-y-2">
                  {result.results.map((r) => (
                    <Link
                      key={r.id}
                      to="/restaurants/$id"
                      params={{ id: r.id }}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 rounded-xl border border-border p-2 hover:border-primary/40 hover:bg-secondary/40 transition"
                    >
                      <img
                        src={r.image}
                        alt={r.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.matchReason}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-primary shrink-0">
                        {r.matchScore}%
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Nouvelle recherche
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
            className="border-t border-border p-2.5 flex items-center gap-2 bg-background"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex : brunch terrasse pas cher…"
              className="flex-1 bg-secondary/50 rounded-full px-3.5 py-2 text-sm outline-none focus:bg-secondary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition shrink-0"
              aria-label="Envoyer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <Link
            to="/ai-assistant"
            onClick={() => setOpen(false)}
            className="text-center text-[10px] text-muted-foreground hover:text-foreground py-1.5 border-t border-border"
          >
            Ouvrir l'assistant complet →
          </Link>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
        aria-expanded={open}
        className="fixed z-40 bottom-4 left-4 sm:bottom-6 sm:left-6
                   h-[52px] w-[52px] sm:h-14 sm:w-14 rounded-full
                   bg-gradient-primary text-primary-foreground
                   shadow-elevated hover:shadow-glow
                   inline-flex items-center justify-center
                   transition-all duration-200 hover:scale-105 active:scale-95
                   ring-1 ring-foreground/5"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
        )}
      </button>
    </>
  );
}
