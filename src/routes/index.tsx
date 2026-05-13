import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowRight, Sparkles, Star, Compass, Tag, Clock, Plus } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { categories, QUICK_FILTERS, type Restaurant } from "@/data/restaurants";
import { fetchApiRestaurants } from "@/lib/restaurants-api";
import { mapApiRestaurantsToRestaurants } from "@/lib/restaurant-mappers";
import { useI18n } from "@/lib/i18n";
import heroFood from "@/assets/hero-food.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalFood — Trouvez où manger autour de vous" },
      {
        name: "description",
        content:
          "Découvrez les meilleurs restaurants, snacks, brunchs et desserts près de chez vous selon vos envies.",
      },
      { property: "og:title", content: "LocalFood — Trouvez où manger autour de vous" },
      {
        property: "og:description",
        content: "Découvrez les meilleurs restaurants près de chez vous selon vos envies.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORY_TAGS: Record<string, string | undefined> = {
  snack: "Snack",
  brunch: "Brunch",
  dessert: "Dessert",
  vegan: "Vegan",
  halal: "Halal",
};

function HomePage() {
  const [apiRestaurants, setApiRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsMessage, setRestaurantsMessage] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;

    setRestaurantsMessage("");

    fetchApiRestaurants()
      .then((data) => {
        if (cancelled) return;

        const mapped = mapApiRestaurantsToRestaurants(data);
        setApiRestaurants(mapped);

        if (mapped.length === 0) {
          setRestaurantsMessage(t("home.noActiveRestaurants"));
        }
      })
      .catch((error) => {
        console.error("Failed to load home restaurants from LocalFood API:", error);

        if (!cancelled) {
          setApiRestaurants([]);
          setRestaurantsMessage(t("home.loadError"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceRestaurants = apiRestaurants;

  const popular = useMemo(
    () => [...sourceRestaurants].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 4),
    [sourceRestaurants],
  );

  const openNow = useMemo(
    () => sourceRestaurants.filter((restaurant) => restaurant.open).slice(0, 4),
    [sourceRestaurants],
  );

  const newOnes = useMemo(
    () => sourceRestaurants.filter((restaurant) => restaurant.isNew).slice(0, 4),
    [sourceRestaurants],
  );

  const deals = useMemo(
    () => sourceRestaurants.filter((restaurant) => restaurant.hasOffer).slice(0, 3),
    [sourceRestaurants],
  );

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroFood} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pt-28 sm:pb-36 text-primary-foreground">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/10 backdrop-blur px-3 py-1.5 text-xs font-medium border border-background/20">
              <Sparkles className="h-3.5 w-3.5" /> {t("home.badge")}
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl font-semibold leading-[1.05] text-balance">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/85 max-w-xl">
              {t("home.heroDescription")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/restaurants"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
              >
                {t("home.viewRestaurants")} <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/ai-assistant"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background/10 backdrop-blur px-6 py-3 text-sm font-semibold border border-background/20 hover:bg-background/20 transition"
              >
                {t("home.tryAi")} <Sparkles className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2" aria-label={t("home.popularCravings")}>
              {QUICK_FILTERS.slice(0, 8).map((t) => (
                <Link
                  key={t}
                  to="/restaurants"
                  search={{ tag: t }}
                  className="rounded-full bg-background/10 backdrop-blur px-3 py-1.5 text-xs border border-background/20 hover:bg-background/20 transition"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI ASSISTANT TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="rounded-3xl bg-card border border-border shadow-elevated p-6 sm:p-8">
          <div className="flex items-start gap-4 flex-wrap">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shrink-0 shadow-glow">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-[260px]">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                {t("home.aiBadge")}
              </div>
              <h2 className="font-display text-2xl font-semibold mt-1">{t("home.aiTitle")}</h2>
              <p className="text-muted-foreground text-sm mt-2">{t("home.aiDescription")}</p>
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                L’assistant IA sera branché sur les données réelles LocalFood avant la mise en
                production.
              </div>
            </div>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              {t("home.tryAssistant")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-semibold">{t("home.categoriesTitle")}</h2>
            <p className="text-muted-foreground mt-1">{t("home.categoriesSubtitle")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/restaurants"
              search={CATEGORY_TAGS[c.id] ? { tag: CATEGORY_TAGS[c.id] } : undefined}
              className="group rounded-2xl bg-card border border-border p-4 text-center hover:shadow-soft hover:-translate-y-0.5 transition"
            >
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-2 text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {restaurantsMessage && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            {restaurantsMessage}
          </div>
        </section>
      )}

      {/* POPULAR */}
      <SectionWithCarousel
        title={t("home.popularTitle")}
        subtitle={t("home.popularSubtitle")}
        items={popular}
      />

      {/* OPEN NOW */}
      <SectionWithCarousel
        title={t("home.openNowTitle")}
        subtitle={t("home.openNowSubtitle")}
        items={openNow}
        icon={Clock}
      />

      {/* NEW */}
      {newOnes.length > 0 && (
        <SectionWithCarousel
          title={t("home.newTitle")}
          subtitle={t("home.newSubtitle")}
          items={newOnes}
          icon={Plus}
        />
      )}

      {/* DEALS */}
      {deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Tag className="h-3 w-3" /> {t("home.dealsBadge")}
              </div>
              <h2 className="font-display text-3xl font-semibold mt-1">{t("home.dealsTitle")}</h2>
              <p className="text-muted-foreground mt-1">{t("home.dealsSubtitle")}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((r) => (
              <Link
                key={r.id}
                to="/restaurants/$id"
                params={{ id: r.id }}
                className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-elevated transition"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={r.image}
                    alt={`${r.name} - ${r.category}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs text-muted-foreground">{r.name}</div>
                  <div className="font-display text-lg font-semibold mt-1">{r.offer?.title}</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-gradient-primary text-primary-foreground px-3 py-1.5 text-xs font-mono font-bold tracking-wider">
                      {r.offer?.code}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.distanceKm} km</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">{t("home.howTitle")}</h2>
          <p className="text-muted-foreground mt-3">{t("home.howSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Search,
              title: t("home.step1Title"),
              desc: t("home.step1Desc"),
            },
            {
              icon: Star,
              title: t("home.step2Title"),
              desc: t("home.step2Desc"),
            },
            {
              icon: Compass,
              title: t("home.step3Title"),
              desc: t("home.step3Desc"),
            },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-7 shadow-soft">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground mb-5">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-primary mb-1">
                {t("home.step")} {i + 1}
              </div>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA RESTOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-10 sm:p-14 shadow-elevated overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {t("home.restaurantCtaBadge")}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-3 leading-tight">
                {t("home.restaurantCtaTitle")
                  .split("\\n")
                  .map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
              </h2>
              <p className="mt-4 opacity-90 max-w-md">{t("home.restaurantCtaDescription")}</p>
            </div>
            <div className="flex md:justify-end gap-3 flex-wrap">
              <Link
                to="/for-restaurants"
                className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:bg-background/90 transition"
              >
                {t("home.learnMore")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/restaurant-dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-semibold hover:bg-primary-foreground/10 transition"
              >
                {t("home.dashboardDemo")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionWithCarousel({
  title,
  subtitle,
  items,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  items: Restaurant[];
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const { t } = useI18n();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <h2 className="font-display text-3xl font-semibold">{title}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Link
          to="/restaurants"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("home.viewAll")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("home.emptySection")}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </section>
  );
}
