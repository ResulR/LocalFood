import { useEffect, useState } from "react";
import { Upload, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  restaurants as localRestaurants,
  PHOTO_CATEGORIES,
  type PhotoCategory,
  type RestaurantPhoto,
} from "@/data/restaurants";
import { fetchSupabaseRestaurantBySlug } from "@/lib/restaurants-api";
import { mapSupabaseRestaurantToRestaurant } from "@/lib/restaurant-mappers";

export function PhotosView() {
  const [photos, setPhotos] = useState<RestaurantPhoto[]>(localRestaurants[0].photos);
  const [filter, setFilter] = useState<PhotoCategory | "Toutes">("Toutes");
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSupabaseRestaurantBySlug("maison-zayna")
      .then((data) => {
        if (cancelled || !data) return;

        const mapped = mapSupabaseRestaurantToRestaurant(data);
        setPhotos(mapped.photos);
      })
      .catch((error) => {
        console.error("Failed to load restaurant photos from Supabase:", error);

        if (!cancelled) {
          setPhotos(localRestaurants[0].photos);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPhotos(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const all = photos;
  const filtered = filter === "Toutes" ? all : all.filter((p) => p.category === filter);

  return (
    <div className="space-y-6 max-w-6xl">
      {loadingPhotos && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Chargement des photos...
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Photos</h1>
          <p className="text-muted-foreground mt-1">
            Photos officielles et photos partagées par vos clients.
          </p>
        </div>
        <button
          onClick={() => toast.success("Photos ajoutées")}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          <Upload className="h-4 w-4" /> Ajouter des photos
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Toutes", ...PHOTO_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as PhotoCategory | "Toutes")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              filter === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-border hover:border-foreground/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Galerie ({filtered.length})</h2>
          <div className="text-xs text-muted-foreground">
            {all.filter((p) => p.byClient).length} ajoutées par vos clients
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Aucune photo dans cette catégorie.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p, i) => (
              <div
                key={`${p.url}-${i}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={p.url}
                  alt={p.category}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button className="h-9 w-9 rounded-full bg-background inline-flex items-center justify-center">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toast("Photo supprimée")}
                    className="h-9 w-9 rounded-full bg-background inline-flex items-center justify-center text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

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
      </div>
    </div>
  );
}
