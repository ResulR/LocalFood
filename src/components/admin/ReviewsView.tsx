import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchSupabaseRestaurantReviewsByRestaurantId,
  fetchSupabaseRestaurantsByCompanyId,
  type SupabaseCompanyRestaurant,
  type SupabaseRestaurantReview,
} from "@/lib/restaurants-api";

type AdminReviewStatus = "publié" | "en attente" | "masqué";

type AdminReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  photo?: string;
  status: AdminReviewStatus;
};

function formatReviewDate(createdAt: string) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "il y a 1 jour";
  return `il y a ${diffDays} jours`;
}

function mapSupabaseStatus(status: SupabaseRestaurantReview["status"]): AdminReviewStatus {
  if (status === "pending") return "en attente";
  if (status === "hidden") return "masqué";
  return "publié";
}

function mapSupabaseReview(review: SupabaseRestaurantReview): AdminReview {
  return {
    id: review.id,
    author: review.author_name,
    rating: review.rating,
    date: formatReviewDate(review.created_at),
    comment: review.comment,
    photo: review.photo_url ?? undefined,
    status: mapSupabaseStatus(review.status),
  };
}

export function ReviewsView() {
  const { profile } = useAuth();
  const [currentRestaurant, setCurrentRestaurant] = useState<SupabaseCompanyRestaurant | null>(
    null,
  );
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsMessage, setReviewsMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewsMessage("");
      setCurrentRestaurant(null);
      setReviews([]);

      if (!profile?.current_company_id) {
        setReviewsMessage("Aucune entreprise n’est liée à votre profil.");
        setLoadingReviews(false);
        return;
      }

      const restaurants = await fetchSupabaseRestaurantsByCompanyId(profile.current_company_id);
      const restaurant = restaurants[0] ?? null;

      if (cancelled) return;

      if (!restaurant) {
        setReviewsMessage("Aucun restaurant n’est encore lié à votre entreprise.");
        setLoadingReviews(false);
        return;
      }

      setCurrentRestaurant(restaurant);

      const data = await fetchSupabaseRestaurantReviewsByRestaurantId(restaurant.id);

      if (cancelled) return;

      setReviews(data.map(mapSupabaseReview));
      setLoadingReviews(false);
    }

    loadReviews().catch((error) => {
      console.error("Failed to load restaurant reviews from Supabase:", error);

      if (!cancelled) {
        setReviewsMessage("Impossible de charger les avis clients.");
        setReviews([]);
        setLoadingReviews(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.current_company_id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0,0";

    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    return average.toFixed(1).replace(".", ",");
  }, [reviews]);

  const pendingCount = useMemo(
    () => reviews.filter((review) => review.status === "en attente").length,
    [reviews],
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {loadingReviews && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Chargement des avis...
        </div>
      )}
      {reviewsMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {reviewsMessage}
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold">Avis clients</h1>
        <p className="text-muted-foreground mt-1">Modérez et répondez aux avis de vos clients.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Note moyenne" value={averageRating} sub="sur 5" />
        <Stat
          label="Avis affichés"
          value={String(reviews.length)}
          sub={currentRestaurant?.name ?? "Restaurant"}
        />
        <Stat label="En attente" value={String(pendingCount)} sub="à modérer" />
      </div>

      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {reviews.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Aucun avis client à afficher pour ce restaurant.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold">
                    {rev.author[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{rev.author}</span>
                      <span
                        className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 font-semibold ${
                          rev.status === "publié"
                            ? "bg-success/15 text-success"
                            : rev.status === "en attente"
                              ? "bg-warning/20 text-warning-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating
                                ? "fill-warning text-warning"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{rev.date}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toast.success("Réponse envoyée")}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Répondre
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 sm:pl-13">{rev.comment}</p>
              {rev.photo && (
                <img src={rev.photo} alt="" className="mt-3 rounded-lg max-h-40 object-cover" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
