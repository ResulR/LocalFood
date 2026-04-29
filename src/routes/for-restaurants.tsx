import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Eye,
  Navigation,
  Phone,
  Heart,
  Star,
  Camera,
  Check,
  Sparkles,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/for-restaurants")({
  head: () => ({
    meta: [
      { title: "Pour les restaurateurs — LocalFood" },
      {
        name: "description",
        content:
          "Gagnez en visibilité locale, suivez vos performances et attirez plus de clients avec LocalFood.",
      },
      { property: "og:title", content: "Pour les restaurateurs — LocalFood" },
      {
        property: "og:description",
        content: "Gagnez en visibilité locale et attirez plus de clients.",
      },
    ],
  }),
  component: ForRestaurantsPage,
});

function ForRestaurantsPage() {
  const { t } = useI18n();

  const stats = [
    { label: t("forRestaurants.statViews"), value: "285", icon: Eye },
    { label: t("forRestaurants.statRouteClicks"), value: "74", icon: Navigation },
    { label: t("forRestaurants.statCalls"), value: "32", icon: Phone },
    { label: t("forRestaurants.statGoingClicks"), value: "18", icon: Heart },
  ];

  const benefits = [
    {
      icon: Eye,
      title: t("forRestaurants.visibilityTitle"),
      desc: t("forRestaurants.visibilityDesc"),
    },
    {
      icon: Sparkles,
      title: t("forRestaurants.premiumTitle"),
      desc: t("forRestaurants.premiumDesc"),
    },
    {
      icon: Star,
      title: t("forRestaurants.reviewsTitle"),
      desc: t("forRestaurants.reviewsDesc"),
    },
    {
      icon: Camera,
      title: t("forRestaurants.photosTitle"),
      desc: t("forRestaurants.photosDesc"),
    },
    {
      icon: BarChart3,
      title: t("forRestaurants.statsTitle"),
      desc: t("forRestaurants.statsDesc"),
    },
    {
      icon: Navigation,
      title: t("forRestaurants.mapsTitle"),
      desc: t("forRestaurants.mapsDesc"),
    },
  ];

  const featureBlocks = [
    {
      title: t("forRestaurants.blockListingTitle"),
      desc: t("forRestaurants.blockListingDesc"),
      features: [
        t("forRestaurants.blockListingFeature1"),
        t("forRestaurants.blockListingFeature2"),
        t("forRestaurants.blockListingFeature3"),
      ],
    },
    {
      title: t("forRestaurants.blockPhotosTitle"),
      desc: t("forRestaurants.blockPhotosDesc"),
      features: [
        t("forRestaurants.blockPhotosFeature1"),
        t("forRestaurants.blockPhotosFeature2"),
        t("forRestaurants.blockPhotosFeature3"),
      ],
    },
    {
      title: t("forRestaurants.blockStatsTitle"),
      desc: t("forRestaurants.blockStatsDesc"),
      features: [
        t("forRestaurants.blockStatsFeature1"),
        t("forRestaurants.blockStatsFeature2"),
        t("forRestaurants.blockStatsFeature3"),
      ],
    },
  ];

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> {t("forRestaurants.badge")}
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.05]">
                {t("forRestaurants.heroTitle")}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                {t("forRestaurants.heroDescriptionBefore")}
                <em>{t("forRestaurants.heroDescriptionStrong")}</em>
                {t("forRestaurants.heroDescriptionAfter")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/restaurant-dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
                >
                  {t("forRestaurants.createListing")} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
                >
                  {t("forRestaurants.viewFeatures")}
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("forRestaurants.preview")}
                  </div>
                  <div className="font-display text-xl font-semibold mt-1">
                    {t("forRestaurants.monthPerformance")}
                  </div>
                </div>
                <div className="text-xs rounded-full bg-success/15 text-success px-2.5 py-1 font-medium">
                  +18%
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-xl bg-secondary/60 p-4">
                    <item.icon className="h-4 w-4 text-primary" />
                    <div className="font-display text-3xl font-semibold mt-2">{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            {t("forRestaurants.benefitsTitle")}
          </h2>
          <p className="text-muted-foreground mt-3">{t("forRestaurants.benefitsSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl bg-card border border-border p-6 hover:shadow-soft transition"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fonctionnalites" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 shadow-soft">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> {t("forRestaurants.proSpaceBadge")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-4">
              {t("forRestaurants.featuresTitle")}
            </h2>
            <p className="text-muted-foreground mt-3">{t("forRestaurants.featuresDesc")}</p>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {featureBlocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-border bg-background p-6">
                <h3 className="font-display text-xl font-semibold">{block.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{block.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {block.features.map((feature) => (
                    <li key={feature} className="text-sm flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/restaurant-dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
            >
              {t("forRestaurants.viewProSpace")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
            >
              {t("forRestaurants.viewRestaurants")}
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
