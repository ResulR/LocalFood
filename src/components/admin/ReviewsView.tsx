import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { restaurants } from "@/data/restaurants";

const allReviews = [
  ...restaurants[0].reviews.map((r) => ({ ...r, status: "publié" as const })),
  {
    id: "x1",
    author: "Antoine R.",
    rating: 4,
    date: "il y a 3 jours",
    comment: "Très bon mais bruyant le samedi soir.",
    status: "publié" as const,
  },
  {
    id: "x2",
    author: "Inès D.",
    rating: 2,
    date: "il y a 4 jours",
    comment: "Service vraiment trop lent, dommage car la cuisine est correcte.",
    status: "en attente" as const,
  },
  {
    id: "x3",
    author: "Mehdi K.",
    rating: 5,
    date: "il y a 5 jours",
    comment: "Le meilleur halal de Lyon, sans hésiter !",
    status: "publié" as const,
  },
];

export function ReviewsView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Avis clients</h1>
        <p className="text-muted-foreground mt-1">Modérez et répondez aux avis de vos clients.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Note moyenne" value="4,8" sub="sur 5" />
        <Stat label="Avis ce mois" value="14" sub="+3 vs mois dernier" />
        <Stat label="En attente" value="1" sub="à modérer" />
      </div>

      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {allReviews.map((rev) => (
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
                      className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 font-semibold ${rev.status === "publié" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"}`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
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
            {"photo" in rev && rev.photo && (
              <img src={rev.photo} alt="" className="mt-3 rounded-lg max-h-40 object-cover" />
            )}
          </div>
        ))}
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
