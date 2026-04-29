import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { useFavorites } from "@/lib/favorites";
import type { Restaurant } from "@/data/restaurants";
import { fetchSupabaseRestaurants } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantsToRestaurants } from "@/lib/restaurant-mappers";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Mes favoris — LocalFood" },
      { name: "description", content: "Retrouvez vos restaurants favoris sur LocalFood." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const [supabaseRestaurants, setSupabaseRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantsMessage, setRestaurantsMessage] = useState("");

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
        console.error("Failed to load favorite restaurants from Supabase:", error);

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

  const favs = useMemo(
    () => sourceRestaurants.filter((restaurant) => ids.includes(restaurant.id)),
    [ids, sourceRestaurants],
  );

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loadingRestaurants && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Chargement de vos favoris...
          </div>
        )}

        {restaurantsMessage && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {restaurantsMessage}
          </div>
        )}

        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Heart className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Mes favoris</h1>
        </div>

        <p className="text-muted-foreground">
          {favs.length} restaurant{favs.length > 1 ? "s" : ""} enregistré
          {favs.length > 1 ? "s" : ""}.
        </p>

        {favs.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary inline-flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Aucun favori pour le moment</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Cliquez sur le cœur d'un restaurant pour l'ajouter à vos favoris et le retrouver ici.
            </p>
            <Link
              to="/restaurants"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90"
            >
              <Search className="h-4 w-4" /> Découvrir les restaurants
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favs.map((r) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
