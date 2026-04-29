import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Wand2 } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import type { Restaurant } from "@/data/restaurants";
import {
  searchRestaurantsWithAI,
  type AIRestaurantSearchResult,
  type RestaurantAIRecommendation,
} from "@/lib/restaurants-api";
import { useI18n } from "@/lib/i18n";

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

type AIPageRestaurant = Restaurant & {
  matchReason?: string;
};

type AIPageResult = AIRestaurantSearchResult & {
  restaurants: AIPageRestaurant[];
};

function mapAIRecommendationToRestaurant(
  recommendation: RestaurantAIRecommendation,
  hoursUnknown: string,
): AIPageRestaurant {
  const tagLabels = recommendation.tags.map((tag) => tag.label);
  const badgeLabels = recommendation.badges.map((badge) => badge.label);
  const primaryReason = recommendation.matchReasons[0];

  return {
    id: recommendation.slug,
    slug: recommendation.slug,
    name: recommendation.name,
    category: recommendation.category,
    cuisineType: recommendation.cuisineType,
    description: recommendation.description,
    image: recommendation.imageUrl ?? "",
    gallery: recommendation.imageUrl ? [recommendation.imageUrl] : [],
    photos: [],
    rating: recommendation.rating,
    reviewsCount: recommendation.reviewsCount,
    detailedRating: {
      food: recommendation.rating,
      welcome: recommendation.rating,
      price: recommendation.rating,
      cleanliness: recommendation.rating,
      ambiance: recommendation.rating,
      waitTime: recommendation.rating,
    },
    distanceKm: 0,
    latitude: undefined,
    longitude: undefined,
    price: recommendation.priceLabel,
    priceLevel: recommendation.priceLabel.length as 1 | 2 | 3,
    open: recommendation.isOpen,
    hours: recommendation.hoursSummary ?? hoursUnknown,
    openingHours: {},
    tags: tagLabels as Restaurant["tags"],
    badges: badgeLabels as Restaurant["badges"],
    address: `${recommendation.address}, ${recommendation.city}`,
    city: recommendation.city,
    phone: recommendation.phone ?? "",
    reviews: [],
    isNew: false,
    hasOffer: Boolean(recommendation.offer),
    offer: recommendation.offer
      ? {
          code: recommendation.offer.code,
          title: recommendation.offer.title,
          description: recommendation.offer.description,
          conditions: recommendation.offer.conditions ?? undefined,
        }
      : undefined,
    localFoodMatchScore: recommendation.matchScore,
    menuUrl: recommendation.menuUrl ?? "",
    googleMapsUrl: recommendation.googleMapsUrl ?? "",
    wazeUrl: recommendation.wazeUrl ?? "",

    hasParking: tagLabels.includes("Parking"),
    hasTerrace: tagLabels.includes("Terrasse"),
    isHalal: tagLabels.includes("Halal"),
    isVeganFriendly: tagLabels.includes("Vegan"),
    isChildFriendly: tagLabels.includes("Enfant"),
    hasDelivery: tagLabels.includes("Livraison"),
    hasTakeaway: tagLabels.includes("À emporter"),
    isCheap: tagLabels.includes("Pas cher"),
    isDateNight: tagLabels.includes("Date night"),
    isSnack: tagLabels.includes("Snack"),
    isBrunch: tagLabels.includes("Brunch"),
    isDessert: tagLabels.includes("Dessert"),

    matchReason: primaryReason,
    stats: {
      views: 0,
      googleMaps: 0,
      waze: 0,
      calls: 0,
      menu: 0,
      going: 0,
      reviewsReceived: 0,
      photosAdded: 0,
      aiClicks: 0,
      aiAppearances: 0,
    },
  };
}

function AIAssistantPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIPageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useI18n();

  const submit = async (q: string) => {
    const value = q.trim();

    if (!value) return;

    setQuery(value);
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await searchRestaurantsWithAI(value);

      setResult({
        ...data,
        restaurants: data.recommendations.map((recommendation) =>
          mapAIRecommendationToRestaurant(recommendation, t("aiPage.hoursUnknown")),
        ),
      });
    } catch (error) {
      console.error("Failed to search restaurants with AI:", error);
      setResult(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de contacter l'assistant LocalFood.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="bg-gradient-warm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> {t("aiPage.titleBadge")}
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-tight text-balance">
            {t("aiPage.heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("aiPage.heroDescription")}
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
              placeholder={t("aiPage.placeholder")}
              className="flex-1 px-4 py-3 bg-transparent text-foreground outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-glow hover:opacity-95 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {t("aiPage.submit")}
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {loading && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Wand2 className="h-6 w-6 mx-auto text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground mt-3">{t("aiPage.loading")}</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
            <Sparkles className="h-7 w-7 mx-auto text-destructive" />
            <h2 className="mt-4 font-display text-xl font-semibold">{t("aiPage.errorTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && !result && (
          <div className="rounded-3xl bg-card border border-border p-10 text-center">
            <Sparkles className="h-7 w-7 mx-auto text-primary" />
            <h2 className="mt-4 font-display text-xl font-semibold">{t("aiPage.emptyTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              L'assistant LocalFood ne recommande que les restaurants actifs de notre base. Il
              filtre selon vos critères : envie, ambiance, budget, contraintes pratiques.
            </p>
          </div>
        )}

        {!loading && !errorMessage && result && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-soft">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shrink-0">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("aiPage.youAsked")}</p>
                  <p className="font-display text-xl font-semibold">« {query} »</p>
                  <p className="mt-3 text-foreground/90">{result.answer}</p>
                  {result.detectedTags.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        {t("aiPage.detectedCriteria")}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.detectedTags.map((tag) => (
                          <span
                            key={tag.slug}
                            className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-medium"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.restaurants.length > 0 ? (
              <div>
                <h3 className="font-display text-2xl font-semibold mb-5">
                  {t("aiPage.recommendations")}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.restaurants.map((restaurant) => (
                    <div key={restaurant.id}>
                      <RestaurantCard r={restaurant} matchScore={restaurant.localFoodMatchScore} />
                      {restaurant.matchReason && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {restaurant.matchReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {t("aiPage.noResult")}
              </div>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
