import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Minus, Send, Sparkles, X } from "lucide-react";
import { searchRestaurantsWithAI, type AIRestaurantSearchResult } from "@/lib/restaurants-api";
import { useI18n } from "@/lib/i18n";

/**
 * FloatingAIAssistant
 * Widget IA compact branché sur l'API backend LocalFood.
 * - Aucun mock local
 * - Aucun fallback local
 * - Aucun prompt hardcodé
 * - Réponse courte adaptée au panneau flottant
 */
export function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIRestaurantSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function submit(q: string) {
    const value = q.trim();

    if (!value || loading) return;

    setQuery(value);
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await searchRestaurantsWithAI(value);
      setResult(data);
    } catch (error) {
      console.error("Failed to search restaurants from floating assistant:", error);
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : t("floatingAi.unavailableFallback"));
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setResult(null);
    setQuery("");
    setErrorMessage("");
    inputRef.current?.focus();
  }

  const compactRecommendations = result?.recommendations.slice(0, 3) ?? [];

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t("floatingAi.title")}
          className="fixed z-40 bg-background border border-border shadow-elevated rounded-2xl flex flex-col overflow-hidden
                     bottom-[92px] left-4 right-4 max-h-[70vh]
                     sm:left-6 sm:right-auto sm:bottom-[96px] sm:w-[380px] sm:max-h-[520px]"
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold leading-tight">
                  {t("floatingAi.title")}
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate">
                  {t("floatingAi.subtitle")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                aria-label={t("common.reduce")}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setResult(null);
                  setQuery("");
                  setErrorMessage("");
                }}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                aria-label={t("common.close")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!result && !errorMessage && !loading && (
              <div className="rounded-xl bg-secondary/40 border border-border p-3">
                <p className="text-sm font-medium">{t("floatingAi.initialTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("floatingAi.initialDescription")}
                </p>
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <Sparkles className="h-5 w-5 mx-auto text-primary animate-pulse" />
                <p className="mt-2 text-xs text-muted-foreground">{t("floatingAi.loading")}</p>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium">{t("floatingAi.unavailableTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
                <button
                  onClick={resetConversation}
                  className="mt-2 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {t("common.retry")}
                </button>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-3">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {t("floatingAi.yourRequest")}
                  </div>
                  <div className="text-sm">{query}</div>
                  {result.detectedTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.detectedTags.map((tag) => (
                        <span
                          key={tag.slug}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-foreground/70"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{result.answer}</p>

                {compactRecommendations.length > 0 ? (
                  <div className="space-y-2">
                    {compactRecommendations.map((restaurant) => (
                      <Link
                        key={restaurant.id}
                        to="/restaurants/$id"
                        params={{ id: restaurant.slug }}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-3 rounded-xl border border-border p-2 hover:border-primary/40 hover:bg-secondary/40 transition"
                      >
                        {restaurant.imageUrl ? (
                          <img
                            src={restaurant.imageUrl}
                            alt={restaurant.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="h-12 w-12 rounded-lg bg-secondary inline-flex items-center justify-center text-muted-foreground">
                            <Sparkles className="h-4 w-4" />
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{restaurant.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {restaurant.matchReasons[0] ?? restaurant.category}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-primary shrink-0">
                          {restaurant.matchScore}%
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    {t("floatingAi.noResult")}
                  </div>
                )}

                <button
                  onClick={resetConversation}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {t("common.newSearch")}
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(query);
            }}
            className="border-t border-border p-2.5 flex items-center gap-2 bg-background"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("floatingAi.placeholder")}
              className="flex-1 bg-secondary/50 rounded-full px-3.5 py-2 text-sm outline-none focus:bg-secondary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition shrink-0 disabled:opacity-60"
              aria-label={t("common.send")}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          <Link
            to="/ai-assistant"
            onClick={() => setOpen(false)}
            className="text-center text-[10px] text-muted-foreground hover:text-foreground py-1.5 border-t border-border"
          >
            {t("floatingAi.openFull")}
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((currentOpen) => !currentOpen)}
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
