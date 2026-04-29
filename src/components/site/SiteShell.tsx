import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, MapPin, Heart, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { FloatingAIAssistant } from "./FloatingAIAssistant";

export function SiteHeader() {
  const { ids } = useFavorites();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        Accueil
      </Link>
      <Link
        to="/restaurants"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        Restaurants
      </Link>
      <Link
        to="/ai-assistant"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        onClick={() => setOpen(false)}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Assistant IA
      </Link>
      <Link
        to="/for-restaurants"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        Pour les restaurateurs
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span>LocalFood</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {links}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/restaurants"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-4 w-4" /> Autour de moi
          </Link>
          <Link
            to="/favorites"
            className="relative h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary"
            aria-label="Favoris"
          >
            <Heart className="h-4 w-4" />
            {ids.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold inline-flex items-center justify-center px-1">
                {ids.length}
              </span>
            )}
          </Link>
          <Link
            to="/restaurant-dashboard"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Espace pro
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="md:hidden h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 bg-background p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg font-semibold">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-sm">{links}</nav>
            <Link
              to="/restaurant-dashboard"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-medium w-full"
            >
              Espace pro
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-semibold mb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            LocalFood
          </div>
          <p className="text-sm text-muted-foreground">
            Trouvez les meilleurs endroits où manger autour de vous selon vos envies.
          </p>
          <div className="mt-4 flex gap-2">
            {["Twitter", "Instagram", "TikTok"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Découvrir</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/restaurants" className="hover:text-foreground">
                Restaurants
              </Link>
            </li>
            <li>
              <Link to="/restaurants" className="hover:text-foreground">
                Brunch
              </Link>
            </li>
            <li>
              <Link to="/restaurants" className="hover:text-foreground">
                Vegan
              </Link>
            </li>
            <li>
              <Link to="/restaurants" className="hover:text-foreground">
                Halal
              </Link>
            </li>
            <li>
              <Link to="/ai-assistant" className="hover:text-foreground">
                Assistant IA
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-foreground">
                Mes favoris
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Pro</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/for-restaurants" className="hover:text-foreground">
                Devenir partenaire
              </Link>
            </li>
            <li>
              <Link to="/restaurant-dashboard" className="hover:text-foreground">
                Tableau de bord
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">À propos</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Concept</li>
            <li>Contact</li>
            <li>Mentions légales</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LocalFood — Découvrez les meilleures adresses autour de vous
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingAIAssistant />
    </div>
  );
}
