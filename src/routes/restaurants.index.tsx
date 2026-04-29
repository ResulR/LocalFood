import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { QUICK_FILTERS, type Restaurant, type RestaurantTag } from "@/data/restaurants";
import {
  calculateDistanceKm,
  dismissLocationPrompt,
  getSavedUserLocation,
  hasDismissedLocationPrompt,
  saveUserLocation,
  type LocationDismissReason,
  type UserLocation,
} from "@/lib/location";
import { fetchSupabaseRestaurants } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantsToRestaurants } from "@/lib/restaurant-mappers";

type RestaurantsSearch = {
  tag?: string;
};

export const Route = createFileRoute("/restaurants/")({
  validateSearch: (search: Record<string, unknown>): RestaurantsSearch => ({
    tag: typeof search.tag === "string" ? search.tag : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Restaurants près de vous — LocalFood" },
      {
        name: "description",
        content: "Liste des restaurants, snacks, brunchs et desserts disponibles autour de vous.",
      },
    ],
  }),
  component: RestaurantsPage,
});

type Sort = "near" | "rating" | "popular" | "open";
type LocationStatus = "idle" | "loading" | "success" | "error";

function isRestaurantTag(value: string | null): value is RestaurantTag {
  return QUICK_FILTERS.includes(value as RestaurantTag);
}

function RestaurantsPage() {
  const { tag: initialTag } = Route.useSearch();
  const [active, setActive] = useState<Set<RestaurantTag>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("near");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [supabaseRestaurants, setSupabaseRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantsMessage, setRestaurantsMessage] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState("");

  const toggle = (t: RestaurantTag) => {
    const n = new Set(active);

    if (n.has(t)) {
      n.delete(t);
    } else {
      n.add(t);
    }

    setActive(n);
  };

  useEffect(() => {
    if (!initialTag) {
      return;
    }

    if (isRestaurantTag(initialTag)) {
      setActive(new Set([initialTag]));
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("tag");

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [initialTag]);

  useEffect(() => {
    const savedLocation = getSavedUserLocation();

    if (savedLocation) {
      setUserLocation(savedLocation);
      return;
    }

    if (!hasDismissedLocationPrompt()) {
      setShowLocationPrompt(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoadingRestaurants(true);
    setRestaurantsMessage("");

    fetchSupabaseRestaurants()
      .then((data) => {
        if (cancelled) return;

        const mapped = mapSupabaseRestaurantsToRestaurants(data);
        setSupabaseRestaurants(mapped);

        if (mapped.length === 0) {
          setRestaurantsMessage("Aucun restaurant actif n’est disponible pour le moment.");
        }
      })
      .catch((error) => {
        console.error("Failed to load restaurants from Supabase:", error);

        if (!cancelled) {
          setSupabaseRestaurants([]);
          setRestaurantsMessage("Impossible de charger les restaurants depuis la base de données.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRestaurants(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceRestaurants = supabaseRestaurants;

  const restaurantsWithDistance = useMemo(() => {
    if (!userLocation) {
      return sourceRestaurants;
    }

    return sourceRestaurants.map((restaurant) => {
      if (typeof restaurant.latitude !== "number" || typeof restaurant.longitude !== "number") {
        return restaurant;
      }

      return {
        ...restaurant,
        distanceKm: calculateDistanceKm(userLocation, {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }),
      };
    });
  }, [sourceRestaurants, userLocation]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let list = restaurantsWithDistance.filter((r) => {
      const matchesFilters = [...active].every((t) => r.tags.includes(t));

      if (!normalizedSearch) return matchesFilters;

      const searchableText = [
        r.name,
        r.category,
        r.cuisineType,
        r.description,
        r.city,
        r.address,
        r.price,
        ...r.tags,
        ...r.badges,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilters && searchableText.includes(normalizedSearch);
    });

    if (sort === "near") list = [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "popular") list = [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
    if (sort === "open") list = [...list].sort((a, b) => Number(b.open) - Number(a.open));

    return list;
  }, [active, search, sort, restaurantsWithDistance]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      dismissLocation("unavailable");
      setLocationStatus("error");
      setLocationMessage(
        "La localisation n'est pas disponible sur votre navigateur. Vous pouvez continuer à explorer les restaurants.",
      );
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        saveUserLocation(latitude, longitude);
        setUserLocation({
          latitude,
          longitude,
          savedAt: new Date().toISOString(),
        });
        setShowLocationPrompt(false);
        setLocationStatus("success");
        setLocationMessage("Votre position est prise en compte pour trier les restaurants.");
        setSort("near");
      },
      (error) => {
        const reason: LocationDismissReason =
          error.code === error.PERMISSION_DENIED ? "denied" : "error";

        dismissLocation(reason);
        setLocationStatus("error");
        setLocationMessage(
          "Impossible de récupérer votre position. Vous pouvez continuer à explorer les restaurants.",
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  };

  const dismissLocation = (reason: LocationDismissReason) => {
    dismissLocationPrompt(reason);
    setShowLocationPrompt(false);
  };

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold">
              Restaurants autour de vous
            </h1>
            <p className="text-muted-foreground mt-2">
              {filtered.length} adresse{filtered.length > 1 ? "s" : ""} disponible
              {filtered.length > 1 ? "s" : ""} autour de vous.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher : halal, brunch, sushi..."
                className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={requestUserLocation}
                disabled={locationStatus === "loading"}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MapPin className="h-4 w-4" />
                {locationStatus === "loading" ? "Localisation..." : "Autour de moi"}
              </button>

              <button
                onClick={() => setMobileFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filtres{" "}
                {active.size > 0 && `(${active.size})`}
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ring"
              >
                <option value="near">Plus proche</option>
                <option value="rating">Mieux noté</option>
                <option value="popular">Plus populaire</option>
                <option value="open">Ouvert maintenant</option>
              </select>
            </div>
          </div>
        </div>

        {locationMessage && (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm ${
              locationStatus === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {locationMessage}
          </div>
        )}

        <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl bg-card border border-border p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Filtres</div>
                {active.size > 0 && (
                  <button
                    onClick={() => setActive(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((t) => (
                  <FilterChip key={t} active={active.has(t)} onClick={() => toggle(t)}>
                    {t}
                  </FilterChip>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileFilters && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-foreground/40"
              onClick={() => setMobileFilters(false)}
            >
              <div
                className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-background p-6 max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="font-display text-xl font-semibold">Filtres</div>
                  <button
                    onClick={() => setMobileFilters(false)}
                    className="h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((t) => (
                    <FilterChip key={t} active={active.has(t)} onClick={() => toggle(t)}>
                      {t}
                    </FilterChip>
                  ))}
                </div>
                <button
                  onClick={() => setMobileFilters(false)}
                  className="mt-6 w-full rounded-full bg-foreground text-background py-3 text-sm font-medium"
                >
                  Voir {filtered.length} résultats
                </button>
              </div>
            </div>
          )}

          <div>
            {loadingRestaurants && (
              <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Chargement des restaurants...
              </div>
            )}
            {restaurantsMessage && (
              <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {restaurantsMessage}
              </div>
            )}

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} r={r} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">
                  Aucun restaurant ne correspond à vos filtres.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-soft">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <MapPin className="h-5 w-5" />
            </div>

            <h2 className="font-display text-2xl font-semibold">
              Trouver les restaurants proches de vous ?
            </h2>

            <p className="mt-3 text-sm text-muted-foreground">
              LocalFood peut utiliser votre position pour trier les restaurants autour de vous.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={requestUserLocation}
                disabled={locationStatus === "loading"}
                className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locationStatus === "loading" ? "Localisation..." : "Utiliser ma position"}
              </button>

              <button
                onClick={() => dismissLocation("later")}
                className="rounded-full border border-border px-5 py-3 text-sm font-medium hover:border-foreground/40"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteShell>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${active ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
    >
      {children}
    </button>
  );
}
