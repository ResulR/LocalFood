import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { RestaurantCard } from "@/components/site/RestaurantCard";
import { fetchSupabaseRestaurants, type SupabaseRestaurantListItem } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantsToRestaurants } from "@/lib/restaurant-mappers";

export const Route = createFileRoute("/dev-supabase-test")({
  component: DevSupabaseTestPage,
});

function DevSupabaseTestPage() {
  const [restaurants, setRestaurants] = useState<SupabaseRestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const mappedRestaurants = useMemo(
    () => mapSupabaseRestaurantsToRestaurants(restaurants),
    [restaurants],
  );

  useEffect(() => {
    fetchSupabaseRestaurants()
      .then((data) => {
        setRestaurants(data);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">Test Supabase</h1>
        <p className="text-muted-foreground mt-2">
          Cette page vérifie uniquement la lecture des restaurants depuis Supabase.
        </p>

        {loading && <p className="mt-8 text-sm text-muted-foreground">Chargement...</p>}

        {!loading && errorMessage && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">
              Restaurants récupérés : {restaurants.length}
            </div>

            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mappedRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} r={restaurant} />
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="rounded-xl border border-border p-4">
                  <div className="font-semibold">Données Supabase brutes : {restaurant.name}</div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Tags : {restaurant.tags.length}</div>
                    <div>Badges : {restaurant.badges.length}</div>
                    <div>Photos : {restaurant.photos.length}</div>
                    <div>Horaires : {restaurant.opening_hours.length}</div>
                    <div>Offres : {restaurant.offers.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
