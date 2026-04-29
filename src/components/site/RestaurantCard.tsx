import { Link } from "@tanstack/react-router";
import { Star, MapPin, Phone, Clock, Navigation, Heart, Sparkles, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import type { Restaurant } from "@/data/restaurants";
import { useFavorites } from "@/lib/favorites";
import { trackRestaurantInteractionBySlug } from "@/lib/restaurants-api";

export function RestaurantCard({ r, matchScore }: { r: Restaurant; matchScore?: number }) {
  const { has, toggle } = useFavorites();
  const isFav = has(r.id);
  const score = matchScore ?? r.localFoodMatchScore;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    const added = toggle(r.id);
    toast(added ? "Ajouté aux favoris ❤" : "Retiré des favoris", { description: r.name });
  };

  const trackPublicCardInteraction = (action: string, interactionType: "Maps" | "Appel") => {
    trackRestaurantInteractionBySlug({
      slug: r.slug,
      action,
      source: "public_card",
      interactionType,
    }).catch((error) => {
      console.error("Failed to track restaurant card interaction:", error);
    });
  };

  const openExternalAction = (e: React.MouseEvent, label: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!url) {
      toast.error("Lien indisponible", { description: r.name });
      return;
    }

    trackPublicCardInteraction("Ouverture Google Maps depuis une carte", "Maps");
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(label, { description: r.name });
  };

  const callRestaurant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!r.phone) {
      toast.error("Numéro indisponible", { description: r.name });
      return;
    }

    trackPublicCardInteraction("Appel depuis une carte", "Appel");
    window.location.href = `tel:${r.phone.replace(/\s/g, "")}`;
    toast.success("Appel lancé", { description: r.name });
  };

  return (
    <article className="group rounded-2xl bg-card overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 border border-border/60 flex flex-col">
      <Link
        to="/restaurants/$id"
        params={{ id: r.id }}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <img
          src={r.image}
          alt={r.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
          {r.badges.slice(0, 2).map((b) => (
            <span
              key={b}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold shadow-soft ${
                b === "Premium"
                  ? "bg-gradient-primary text-primary-foreground"
                  : b === "Vérifié"
                    ? "bg-background/95 text-foreground"
                    : b === "Nouveau"
                      ? "bg-success text-success-foreground"
                      : "bg-background/95 text-foreground"
              }`}
            >
              {b === "Vérifié" && <BadgeCheck className="h-3 w-3" />} {b}
            </span>
          ))}
        </div>
        <button
          onClick={handleFav}
          aria-label="Favori"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/95 backdrop-blur shadow-soft inline-flex items-center justify-center hover:scale-110 transition"
        >
          <Heart
            className={`h-4 w-4 transition ${isFav ? "fill-destructive text-destructive" : "text-foreground"}`}
          />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium shadow-soft ${r.open ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {r.open ? "Ouvert" : "Fermé"}
          </span>
          <span className="rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold shadow-soft inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Match {score}%
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold leading-tight truncate">{r.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {r.category} · {r.price}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium shrink-0">
            <Star className="h-4 w-4 fill-warning text-warning" />
            {r.rating.toFixed(1)}{" "}
            <span className="text-muted-foreground text-xs font-normal">({r.reviewsCount})</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {r.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {r.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {r.hours.split("·")[0].trim()}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <Link
            to="/restaurants/$id"
            params={{ id: r.id }}
            className="flex-1 inline-flex justify-center items-center rounded-full bg-foreground text-background px-3 py-2 text-xs font-medium hover:opacity-90 transition"
          >
            Voir la fiche
          </Link>
          <button
            onClick={(e) => openExternalAction(e, "Ouverture de l'itinéraire", r.googleMapsUrl)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-secondary transition"
            title="Itinéraire"
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            onClick={callRestaurant}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-secondary transition"
            title="Appeler"
          >
            <Phone className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
