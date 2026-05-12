import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Menu as MenuIcon,
  Heart,
  Share2,
  ArrowLeft,
  Check,
  Sparkles,
  BadgeCheck,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { PHOTO_CATEGORIES, type PhotoCategory, type Restaurant } from "@/data/restaurants";
import { useFavorites } from "@/lib/favorites";
import {
  fetchApiRestaurantBySlug,
  fetchApiRestaurants,
  trackRestaurantInteractionBySlug,
  type ApiRestaurantInteractionType,
} from "@/lib/restaurants-api";
import {
  mapApiRestaurantToRestaurant,
  mapApiRestaurantsToRestaurants,
} from "@/lib/restaurant-mappers";

export const Route = createFileRoute("/restaurants/$id")({
  loader: async ({ params }) => {
    try {
      const apiRestaurant = await fetchApiRestaurantBySlug(params.id);

      if (!apiRestaurant) {
        throw notFound();
      }

      const restaurants = await fetchApiRestaurants();
      const mappedRestaurants = mapApiRestaurantsToRestaurants(restaurants);

      return {
        restaurant: mapApiRestaurantToRestaurant(apiRestaurant),
        similar: mappedRestaurants
          .filter((restaurant) => restaurant.slug !== apiRestaurant.slug)
          .slice(0, 3),
      };
    } catch (error) {
      console.error("Failed to load restaurant from LocalFood API:", error);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.restaurant.name} — LocalFood` },
          { name: "description", content: loaderData.restaurant.description },
          { property: "og:title", content: `${loaderData.restaurant.name} — LocalFood` },
          { property: "og:description", content: loaderData.restaurant.description },
          { property: "og:image", content: loaderData.restaurant.image },
        ]
      : [],
  }),
  notFoundComponent: RestaurantNotFoundComponent,
  component: RestaurantPage,
});

function buildRestaurantJsonLd(restaurant: Restaurant) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image ? [restaurant.image] : undefined,
    servesCuisine: restaurant.cuisineType,
    priceRange: restaurant.price,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
    },
    telephone: restaurant.phone || undefined,
  };

  if (restaurant.rating > 0 && restaurant.reviewsCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: restaurant.rating.toFixed(1),
      reviewCount: restaurant.reviewsCount,
    };
  }

  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

function RestaurantNotFoundComponent() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">
          {t("restaurantDetail.notFoundTitle")}
        </h1>
        <Link to="/restaurants" className="inline-block mt-4 text-primary hover:underline">
          {t("restaurantDetail.backToRestaurants")}
        </Link>
      </div>
    </SiteShell>
  );
}

function RestaurantPage() {
  const loaderData = Route.useLoaderData();
  const r = loaderData.restaurant;
  const hasTrackedView = useRef(false);
  const { has, toggle } = useFavorites();
  const isFav = has(r.id);
  const { t } = useI18n();

  const similar = loaderData.similar;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photoCat, setPhotoCat] = useState<PhotoCategory | "Toutes">("Toutes");
  const [offerOpen, setOfferOpen] = useState(false);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;

    trackRestaurantInteractionBySlug({
      slug: r.slug,
      action: "Vue de fiche restaurant",
      source: "public_detail",
      interactionType: "Vue",
    }).catch((error) => {
      console.error("Failed to track restaurant detail view:", error);
    });
  }, [r.slug]);

  const filteredPhotos =
    photoCat === "Toutes" ? r.photos : r.photos.filter((p) => p.category === photoCat);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error(t("restaurantDetail.chooseRating"));
    toast.success(t("restaurantDetail.reviewPublished"), {
      description: t("restaurantDetail.reviewThanks"),
    });
    setRating(0);
    setComment("");
  };

  const trackClick = (label: string, target?: string) => {
    toast.success(label, {
      description: target ?? t("restaurantDetail.statsSaved"),
    });
  };

  const trackPublicDetailInteraction = (
    action: string,
    interactionType: ApiRestaurantInteractionType,
  ) => {
    trackRestaurantInteractionBySlug({
      slug: r.slug,
      action,
      source: "public_detail",
      interactionType,
    }).catch((error) => {
      console.error("Failed to track restaurant detail interaction:", error);
    });
  };

  const openRestaurantAction = (
    type: "maps" | "waze" | "call" | "menu" | "intent",
    label: string,
  ) => {
    if (type === "intent") {
      trackPublicDetailInteraction("Clic J'y vais depuis la fiche", "Intent");
      trackClick(label);
      return;
    }

    if (type === "call") {
      if (!r.phone) {
        toast.error(t("restaurantDetail.phoneUnavailable"), { description: r.name });
        return;
      }

      trackPublicDetailInteraction("Appel depuis la fiche", "Appel");
      window.location.href = `tel:${r.phone.replace(/\s/g, "")}`;
      trackClick(label, r.phone);
      return;
    }

    const url =
      type === "maps"
        ? r.googleMapsUrl
        : type === "waze"
          ? r.wazeUrl
          : type === "menu"
            ? r.menuUrl
            : "";

    if (!url) {
      toast.error(t("restaurantDetail.linkUnavailable"), { description: r.name });
      return;
    }

    const interactionType = type === "maps" ? "Maps" : type === "waze" ? "Waze" : "Menu";

    trackPublicDetailInteraction(
      type === "maps"
        ? "Ouverture Google Maps depuis la fiche"
        : type === "waze"
          ? "Ouverture Waze depuis la fiche"
          : "Consultation du menu depuis la fiche",
      interactionType,
    );

    window.open(url, "_blank", "noopener,noreferrer");
    trackClick(label, r.name);
  };

  const handleFav = () => {
    const added = toggle(r.id);
    toast(added ? t("restaurantCard.addedFavorite") : t("restaurantCard.removedFavorite"), {
      description: r.name,
    });
  };

  const restaurantJsonLd = buildRestaurantJsonLd(r);

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: restaurantJsonLd }}
      />

      {/* Cover */}
      <div className="relative h-[42vh] sm:h-[55vh] min-h-[320px] overflow-hidden">
        <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium hover:bg-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("restaurantDetail.back")}
          </Link>
        </div>
        <div className="absolute bottom-0 inset-x-0 px-4 sm:px-6 pb-8 text-primary-foreground">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {r.badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-background/15 backdrop-blur border border-background/20 px-2.5 py-1 text-[11px] font-semibold"
                >
                  {b === "Vérifié" && <BadgeCheck className="h-3 w-3" />} {b}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-1 text-[11px] font-semibold shadow-glow">
                <Sparkles className="h-3 w-3" /> Match {r.localFoodMatchScore}%
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold">{r.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span>
                {r.category} · {r.price}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" /> {r.rating.toFixed(1)} (
                {r.reviewsCount} {t("restaurantDetail.reviews")})
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {r.distanceKm} km · {r.city}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.open ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {r.open ? t("restaurantDetail.openNow") : t("restaurantDetail.closed")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-12">
          {/* Mobile actions */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 lg:hidden">
            <ActionBtn
              icon={Navigation}
              label="Maps"
              onClick={() => openRestaurantAction("maps", t("restaurantDetail.mapsOpened"))}
            />
            <ActionBtn
              icon={Navigation}
              label="Waze"
              onClick={() => openRestaurantAction("waze", t("restaurantDetail.wazeOpened"))}
            />
            <ActionBtn
              icon={Phone}
              label={t("restaurantDetail.call")}
              onClick={() => openRestaurantAction("call", t("restaurantDetail.callStarted"))}
            />
            <ActionBtn
              icon={MenuIcon}
              label="Menu"
              onClick={() => openRestaurantAction("menu", t("restaurantDetail.menuViewed"))}
            />
            <ActionBtn
              icon={Heart}
              label={t("restaurantDetail.going")}
              primary
              onClick={() => openRestaurantAction("intent", t("restaurantDetail.intentSaved"))}
            />
          </div>

          {r.hasOffer && r.offer && (
            <section className="rounded-3xl border border-primary/30 bg-gradient-warm p-6 sm:p-7">
              <div className="flex items-start gap-4 flex-wrap">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shrink-0">
                  <Tag className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-[240px]">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {t("restaurantDetail.localfoodOffer")}
                  </div>
                  <h3 className="font-display text-xl font-semibold mt-1">{r.offer.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.offer.description}</p>
                  {r.offer.conditions && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      {r.offer.conditions}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setOfferOpen(true);
                    trackPublicDetailInteraction("Offre débloquée depuis la fiche", "Offre");
                    trackClick(t("restaurantDetail.offerUnlocked"), r.offer!.code);
                  }}
                  className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                >
                  {t("restaurantDetail.unlockOffer")}
                </button>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">
              {t("restaurantDetail.about")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{r.description}</p>
          </section>

          <section>
            <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-display text-2xl font-semibold">
                {t("restaurantDetail.gallery")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {(["Toutes", ...PHOTO_CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setPhotoCat(c as PhotoCategory | "Toutes")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${photoCat === c ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                >
                  {c === "Toutes" ? t("restaurantDetail.allPhotos") : c}
                </button>
              ))}
            </div>
            {filteredPhotos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t("restaurantDetail.noPhotoInCategory")}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredPhotos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                  >
                    <img
                      src={p.url}
                      alt={p.category}
                      loading="lazy"
                      className="h-full w-full object-cover hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-background/95 backdrop-blur px-2 py-0.5 text-[10px] font-semibold">
                      {p.category}
                    </span>
                    {p.byClient && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-foreground/90 text-background px-2 py-0.5 text-[10px] font-semibold">
                        {p.author}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">
              {t("restaurantDetail.practicalInfo")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {r.tags.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <Check className="h-4 w-4 text-success" /> <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">
              {t("restaurantDetail.detailedRatings")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                { l: t("restaurantDetail.food"), v: r.detailedRating.food },
                { l: t("restaurantDetail.welcome"), v: r.detailedRating.welcome },
                { l: t("restaurantDetail.price"), v: r.detailedRating.price },
                { l: t("restaurantDetail.cleanliness"), v: r.detailedRating.cleanliness },
                { l: t("restaurantDetail.ambiance"), v: r.detailedRating.ambiance },
                { l: t("restaurantDetail.waitTime"), v: r.detailedRating.waitTime },
              ].map((c) => (
                <div key={c.l}>
                  <div className="flex justify-between text-sm">
                    <span>{c.l}</span>
                    <span className="font-medium">{c.v.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary"
                      style={{ width: `${(c.v / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-2xl font-semibold">
                {t("restaurantDetail.customerReviews")}
              </h2>
              <div className="text-sm text-muted-foreground">
                {r.reviewsCount} avis · {r.rating.toFixed(1)} ★
              </div>
            </div>
            <div className="space-y-4">
              {r.reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold">
                        {rev.author[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{rev.author}</div>
                        <div className="text-xs text-muted-foreground">{rev.date}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < rev.rating ? "fill-warning text-warning" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground">{rev.comment}</p>
                  {rev.photo && (
                    <img src={rev.photo} alt="" className="mt-3 rounded-lg max-h-48 object-cover" />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold">
                {t("restaurantDetail.leaveReview")}
              </h3>
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">{t("restaurantDetail.yourRating")}</div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button type="button" key={i} onClick={() => setRating(i + 1)}>
                      <Star
                        className={`h-7 w-7 transition ${i < rating ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("restaurantDetail.reviewPlaceholder")}
                className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-ring min-h-[100px]"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90"
                >
                  {t("restaurantDetail.publishReview")}
                </button>
              </div>
            </form>
          </section>

          {/* Similar */}
          {similar.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-semibold mb-5">
                {t("restaurantDetail.similarRestaurants")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {similar.map((s) => (
                  <RestaurantCard key={s.id} r={s} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Aside */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="space-y-3 text-sm">
                <Info icon={MapPin} label={r.address} />
                <Info icon={Clock} label={r.hours} />
                <Info icon={Phone} label={r.phone} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <ActionBtn
                  icon={Navigation}
                  label="Google Maps"
                  onClick={() => openRestaurantAction("maps", t("restaurantDetail.mapsOpened"))}
                />
                <ActionBtn
                  icon={Navigation}
                  label="Waze"
                  onClick={() => openRestaurantAction("waze", t("restaurantDetail.wazeOpened"))}
                />
                <ActionBtn
                  icon={Phone}
                  label={t("restaurantDetail.call")}
                  onClick={() => openRestaurantAction("call", t("restaurantDetail.callStarted"))}
                />
                <ActionBtn
                  icon={MenuIcon}
                  label={t("restaurantDetail.viewMenu")}
                  onClick={() => openRestaurantAction("menu", t("restaurantDetail.menuViewed"))}
                />
              </div>
              <button
                onClick={() => openRestaurantAction("intent", t("restaurantDetail.intentSaved"))}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
              >
                <Heart className="h-4 w-4" /> {t("restaurantDetail.going")}
              </button>
              <button
                onClick={handleFav}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-secondary"
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />{" "}
                {isFav ? t("restaurantDetail.removeFavorite") : t("restaurantDetail.addFavorite")}
              </button>
              <button
                onClick={() => toast(t("restaurantDetail.linkCopied"))}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-secondary"
              >
                <Share2 className="h-4 w-4" /> {t("restaurantDetail.share")}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t("restaurantDetail.openingHours")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(r.openingHours).map(([d, h]) => (
                  <li key={d} className="flex justify-between">
                    <span>{d}</span>
                    <span className="text-muted-foreground">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Offer modal */}
      {offerOpen && r.offer && (
        <div
          className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
          onClick={() => setOfferOpen(false)}
        >
          <div
            className="bg-background rounded-3xl max-w-md w-full p-8 shadow-elevated relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOfferOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-secondary inline-flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4">
                <Tag className="h-6 w-6" />
              </span>
              <h3 className="font-display text-2xl font-semibold">{r.offer.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{r.offer.description}</p>
              <div className="mt-6 rounded-2xl border-2 border-dashed border-primary p-5">
                <div className="text-xs text-muted-foreground">
                  {t("restaurantDetail.yourCode")}
                </div>
                <div className="font-mono text-3xl font-bold tracking-widest text-primary mt-1">
                  {r.offer.code}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("restaurantDetail.offerCodeHelp")}
              </p>
              <button
                onClick={() => setOfferOpen(false)}
                className="mt-6 w-full rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium"
              >
                {t("restaurantDetail.understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteShell>
  );
}

function Info({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  primary,
  onClick,
}: {
  icon: typeof MapPin;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium transition ${primary ? "bg-gradient-primary text-primary-foreground shadow-glow" : "border border-border hover:bg-secondary"}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
