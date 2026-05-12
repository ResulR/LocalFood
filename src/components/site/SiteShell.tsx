import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, MapPin, Heart, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { AVAILABLE_LANGUAGES, getLanguageLabel, useI18n } from "@/lib/i18n";
import { FloatingAIAssistant } from "./FloatingAIAssistant";

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={
        compact
          ? "flex items-center justify-between rounded-full border border-border bg-secondary/40 p-1"
          : "hidden sm:inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 shadow-soft"
      }
      aria-label={t("common.language")}
    >
      {AVAILABLE_LANGUAGES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={
            compact
              ? `flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  language === item
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`
              : `rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  language === item
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`
          }
        >
          {getLanguageLabel(item)}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { ids } = useFavorites();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const links = (
    <>
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        {t("nav.home")}
      </Link>

      <Link
        to="/restaurants"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        {t("nav.restaurants")}
      </Link>

      <Link
        to="/ai-assistant"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        onClick={() => setOpen(false)}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("nav.aiAssistant")}
      </Link>

      <Link
        to="/for-restaurants"
        activeProps={{ className: "text-foreground" }}
        className="hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        {t("nav.forRestaurants")}
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
            <MapPin className="h-4 w-4" /> {t("nav.nearMe")}
          </Link>

          <LanguageSwitcher />

          <Link
            to="/favorites"
            className="relative h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary"
            aria-label={t("nav.favorites")}
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
            {t("nav.proSpace")}
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"
            aria-label={t("nav.menu")}
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
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg font-semibold">{t("nav.menu")}</span>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 text-sm">{links}</nav>

            <div className="mt-6">
              <LanguageSwitcher compact />
            </div>

            <Link
              to="/restaurant-dashboard"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-medium w-full"
            >
              {t("nav.proSpace")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

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

          <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>

          <div className="mt-4 flex gap-2">
            {["Twitter", "Instagram", "TikTok"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">{t("footer.discover")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/restaurants" className="hover:text-foreground">
                {t("nav.restaurants")}
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
                {t("nav.aiAssistant")}
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-foreground">
                {t("footer.favorites")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">{t("footer.pro")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/for-restaurants" className="hover:text-foreground">
                {t("footer.partner")}
              </Link>
            </li>
            <li>
              <Link to="/restaurant-dashboard" className="hover:text-foreground">
                {t("footer.dashboard")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">{t("footer.about")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("footer.concept")}</li>
            <li>{t("footer.contact")}</li>
            <li>
              <Link to="/legal/mentions-legales" className="hover:text-foreground">
                {t("footer.legal")}
              </Link>
            </li>
            <li>
              <Link to="/legal/confidentialite" className="hover:text-foreground">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link to="/legal/cgu" className="hover:text-foreground">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link to="/legal/cgv" className="hover:text-foreground">
                {t("footer.salesTerms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LocalFood — {t("footer.copyright")}
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
