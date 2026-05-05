import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchSupabaseRestaurantReviewsByRestaurantId,
  updateOwnedRestaurantReviewStatus,
  type SupabaseRestaurantReview,
  type SupabaseRestaurantReviewStatus,
} from "@/lib/restaurants-api";
import { useAdminI18n } from "@/lib/admin-i18n";

type TAdmin = ReturnType<typeof useAdminI18n>["tAdmin"];

type AdminReviewStatus = "publié" | "en attente" | "masqué";

type AdminReview = {
  id: string;
  author: string;
  rating: number;
  createdAt: string;
  comment: string;
  photo?: string;
  status: AdminReviewStatus;
};

function formatReviewDate(createdAt: string, tAdmin: TAdmin) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return tAdmin("admin.reviews.today");
  if (diffDays === 1) return tAdmin("admin.reviews.oneDayAgo");
  return `${diffDays} ${tAdmin("admin.reviews.daysAgo")}`;
}

function mapSupabaseStatus(status: SupabaseRestaurantReview["status"]): AdminReviewStatus {
  if (status === "pending") return "en attente";
  if (status === "hidden") return "masqué";
  return "publié";
}

function mapAdminStatusToSupabaseStatus(status: AdminReviewStatus): SupabaseRestaurantReviewStatus {
  if (status === "en attente") return "pending";
  if (status === "masqué") return "hidden";
  return "published";
}

function formatReviewStatus(status: AdminReviewStatus, tAdmin: TAdmin) {
  if (status === "en attente") return tAdmin("admin.reviews.statusPending");
  if (status === "masqué") return tAdmin("admin.reviews.statusHidden");
  return tAdmin("admin.reviews.statusPublished");
}

const REVIEW_STATUS_OPTIONS: AdminReviewStatus[] = ["publié", "en attente", "masqué"];

function mapSupabaseReview(review: SupabaseRestaurantReview): AdminReview {
  return {
    id: review.id,
    author: review.author_name,
    rating: review.rating,
    createdAt: review.created_at,
    comment: review.comment,
    photo: review.photo_url ?? undefined,
    status: mapSupabaseStatus(review.status),
  };
}

export function ReviewsView() {
  const { role } = useAuth();
  const { tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsMessage, setReviewsMessage] = useState("");
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewsMessage("");
      setReviews([]);

      if (loadingRestaurants) {
        return;
      }

      if (!currentRestaurant) {
        setReviewsMessage(restaurantMessage || tAdmin("admin.reviews.noRestaurantSelected"));
        setLoadingReviews(false);
        return;
      }

      const data = await fetchSupabaseRestaurantReviewsByRestaurantId(currentRestaurant.id);

      if (cancelled) return;

      setReviews(data.map(mapSupabaseReview));
      setLoadingReviews(false);
    }

    loadReviews().catch((error) => {
      console.error("Failed to load restaurant reviews from Supabase:", error);

      if (!cancelled) {
        setReviewsMessage(tAdmin("admin.reviews.loadError"));
        setReviews([]);
        setLoadingReviews(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const updateReviewStatus = async (review: AdminReview, nextStatus: AdminReviewStatus) => {
    if (review.status === nextStatus) return;

    if (role !== "superadmin") {
      toast.error(tAdmin("admin.reviews.unauthorized"), {
        description: tAdmin("admin.reviews.superAdminOnly"),
      });
      return;
    }

    setUpdatingReviewId(review.id);

    try {
      const updatedRows = await updateOwnedRestaurantReviewStatus({
        reviewId: review.id,
        status: mapAdminStatusToSupabaseStatus(nextStatus),
      });

      const updated = updatedRows[0];

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                status: updated ? mapSupabaseStatus(updated.status) : nextStatus,
              }
            : item,
        ),
      );

      toast.success(tAdmin("admin.reviews.updated"));
    } catch (error) {
      console.error("Failed to update review status:", error);
      toast.error(tAdmin("admin.reviews.updateImpossible"), {
        description: tAdmin("admin.reviews.updateRefusedDescription"),
      });
    } finally {
      setUpdatingReviewId(null);
    }
  };

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
          {tAdmin("admin.reviews.loading")}
        </div>
      )}
      {reviewsMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {reviewsMessage}
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold">{tAdmin("admin.reviews.title")}</h1>
        <p className="text-muted-foreground mt-1">{tAdmin("admin.reviews.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat
          label={tAdmin("admin.reviews.averageRating")}
          value={averageRating}
          sub={tAdmin("admin.reviews.outOf5")}
        />
        <Stat
          label={tAdmin("admin.reviews.displayedReviews")}
          value={String(reviews.length)}
          sub={currentRestaurant?.name ?? tAdmin("admin.common.restaurant")}
        />
        <Stat
          label={tAdmin("admin.reviews.pending")}
          value={String(pendingCount)}
          sub={tAdmin("admin.reviews.toModerate")}
        />
      </div>

      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {reviews.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {tAdmin("admin.reviews.empty")}
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
                        {formatReviewStatus(rev.status, tAdmin)}
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
                      <span className="text-xs text-muted-foreground">
                        {formatReviewDate(rev.createdAt, tAdmin)}
                      </span>
                    </div>
                  </div>
                </div>
                {role === "superadmin" ? (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={rev.status}
                      onChange={(event) =>
                        updateReviewStatus(rev, event.target.value as AdminReviewStatus)
                      }
                      disabled={updatingReviewId === rev.id}
                      className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium outline-none hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {REVIEW_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatReviewStatus(status, tAdmin)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
                    {tAdmin("admin.reviews.readOnly")}
                  </span>
                )}
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
