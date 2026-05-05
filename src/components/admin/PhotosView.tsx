import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { PHOTO_CATEGORIES, type PhotoCategory, type RestaurantPhoto } from "@/data/restaurants";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  addOwnedRestaurantPhoto,
  deleteOwnedRestaurantPhoto,
  fetchSupabaseRestaurantById,
  uploadRestaurantPhotoFile,
} from "@/lib/restaurants-api";
import { mapSupabaseRestaurantToRestaurant } from "@/lib/restaurant-mappers";
import { useAdminI18n } from "@/lib/admin-i18n";

const ALL_PHOTOS_FILTER = "Toutes";

export function PhotosView() {
  const { tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const [photos, setPhotos] = useState<RestaurantPhoto[]>([]);
  const [filter, setFilter] = useState<PhotoCategory | typeof ALL_PHOTOS_FILTER>(ALL_PHOTOS_FILTER);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photosMessage, setPhotosMessage] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [newPhotoCategory, setNewPhotoCategory] = useState<PhotoCategory>("Plats");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurantPhotos() {
      setLoadingPhotos(true);
      setPhotosMessage("");
      setPhotos([]);
      setCurrentRestaurantId(null);

      if (loadingRestaurants) {
        return;
      }

      if (!selectedRestaurant) {
        setPhotosMessage(restaurantMessage || tAdmin("admin.photos.noRestaurantSelected"));
        setLoadingPhotos(false);
        return;
      }

      setCurrentRestaurantId(selectedRestaurant.id);

      const data = await fetchSupabaseRestaurantById(selectedRestaurant.id);

      if (cancelled) return;

      if (!data) {
        setPhotos([]);
        setPhotosMessage(tAdmin("admin.photos.loadRestaurantError"));
        setLoadingPhotos(false);
        return;
      }

      const mapped = mapSupabaseRestaurantToRestaurant(data);
      setPhotos(mapped.photos);
      setLoadingPhotos(false);
    }

    loadRestaurantPhotos().catch((error) => {
      console.error("Failed to load restaurant photos from Supabase:", error);

      if (!cancelled) {
        setPhotos([]);
        setCurrentRestaurantId(null);
        setPhotosMessage(tAdmin("admin.photos.loadError"));
        setLoadingPhotos(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const addPhoto = async () => {
    if (!currentRestaurantId) {
      toast.error(tAdmin("admin.photos.addImpossible"), {
        description: tAdmin("admin.photos.noRestaurantLoaded"),
      });
      return;
    }

    if (!selectedPhotoFile) {
      toast.error(tAdmin("admin.photos.missingPhoto"), {
        description: tAdmin("admin.photos.choosePhoto"),
      });
      return;
    }

    setAddingPhoto(true);

    try {
      const publicUrl = await uploadRestaurantPhotoFile({
        restaurantId: currentRestaurantId,
        file: selectedPhotoFile,
      });

      const insertedPhotos = await addOwnedRestaurantPhoto({
        restaurantId: currentRestaurantId,
        url: publicUrl,
        category: newPhotoCategory,
      });

      const insertedPhoto = insertedPhotos[0];

      if (insertedPhoto) {
        setPhotos((current) => [
          ...current,
          {
            id: insertedPhoto.id,
            url: insertedPhoto.url,
            category: insertedPhoto.category as PhotoCategory,
            byClient: insertedPhoto.is_client_photo,
            author: insertedPhoto.author_name ?? undefined,
          },
        ]);
      }

      setSelectedPhotoFile(null);
      setNewPhotoCategory("Plats");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(tAdmin("admin.photos.addedTitle"), {
        description: tAdmin("admin.photos.addedDescription"),
      });
    } catch (error) {
      console.error("Failed to add restaurant photo:", error);
      toast.error(tAdmin("admin.photos.addImpossible"), {
        description: tAdmin("admin.photos.addRefusedDescription"),
      });
    } finally {
      setAddingPhoto(false);
    }
  };

  const deletePhoto = async (photo: RestaurantPhoto) => {
    if (!photo.id) {
      toast.error(tAdmin("admin.photos.deleteImpossible"), {
        description: tAdmin("admin.photos.noSupabaseId"),
      });
      return;
    }

    setDeletingPhotoId(photo.id);

    try {
      await deleteOwnedRestaurantPhoto(photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      toast.success(tAdmin("admin.photos.deletedTitle"), {
        description: tAdmin("admin.photos.deletedDescription"),
      });
    } catch (error) {
      console.error("Failed to delete restaurant photo:", error);
      toast.error(tAdmin("admin.photos.deleteImpossible"), {
        description: tAdmin("admin.photos.deleteRefusedDescription"),
      });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const all = photos;
  const filtered = filter === ALL_PHOTOS_FILTER ? all : all.filter((p) => p.category === filter);

  return (
    <div className="space-y-6 max-w-6xl">
      {loadingPhotos && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {tAdmin("admin.photos.loading")}
        </div>
      )}
      {photosMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {photosMessage}
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{tAdmin("admin.photos.title")}</h1>
          <p className="text-muted-foreground mt-1">{tAdmin("admin.photos.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedPhotoFile(event.target.files?.[0] ?? null)}
            className="min-w-0 sm:w-80 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium"
          />
          <select
            value={newPhotoCategory}
            onChange={(event) => setNewPhotoCategory(event.target.value as PhotoCategory)}
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
          >
            {PHOTO_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={addPhoto}
            disabled={addingPhoto || !currentRestaurantId || !selectedPhotoFile}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />{" "}
            {addingPhoto ? tAdmin("admin.photos.adding") : tAdmin("admin.photos.add")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([ALL_PHOTOS_FILTER, ...PHOTO_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as PhotoCategory | typeof ALL_PHOTOS_FILTER)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              filter === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-border hover:border-foreground/40"
            }`}
          >
            {cat === ALL_PHOTOS_FILTER ? tAdmin("admin.photos.all") : cat}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">
            {tAdmin("admin.photos.gallery")} ({filtered.length})
          </h2>
          <div className="text-xs text-muted-foreground">
            {all.filter((p) => p.byClient).length} {tAdmin("admin.photos.addedByCustomers")}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {tAdmin("admin.photos.emptyCategory")}
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
                    onClick={() => deletePhoto(p)}
                    disabled={deletingPhotoId === p.id}
                    className="h-9 w-9 rounded-full bg-background inline-flex items-center justify-center text-destructive disabled:cursor-not-allowed disabled:opacity-60"
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
