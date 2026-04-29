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

const stats = [
  { label: "vues ce mois-ci", value: "285", icon: Eye },
  { label: "clics itinéraire", value: "74", icon: Navigation },
  { label: "appels reçus", value: "32", icon: Phone },
  { label: "clics « J'y vais »", value: "18", icon: Heart },
];

const benefits = [
  {
    icon: Eye,
    title: "Plus de visibilité",
    desc: "Apparaissez auprès des clients qui cherchent ce que vous proposez, près de chez eux.",
  },
  {
    icon: Sparkles,
    title: "Fiche premium",
    desc: "Mettez en valeur votre restaurant avec photos, badges et description soignée.",
  },
  {
    icon: Star,
    title: "Avis internes",
    desc: "Recevez et répondez aux avis directement depuis votre espace pro.",
  },
  {
    icon: Camera,
    title: "Photos clients",
    desc: "Vos clients partagent leurs photos, vous renforcez votre crédibilité.",
  },
  {
    icon: BarChart3,
    title: "Statistiques de clics",
    desc: "Suivez précisément combien de personnes consultent et contactent votre fiche.",
  },
  {
    icon: Navigation,
    title: "Maps & Waze intégrés",
    desc: "Vos clients lancent l'itinéraire en un clic, vous gagnez du trafic réel.",
  },
];

function ForRestaurantsPage() {
  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> Pour les restaurateurs
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.05]">
                Faites découvrir votre restaurant à toute la ville.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                LocalFood vous connecte aux clients qui cherchent <em>exactement</em> ce que vous
                proposez : halal, vegan, brunch, terrasse, date night… selon leurs envies, ici et
                maintenant.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/restaurant-dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-glow hover:opacity-95"
                >
                  Créer ma fiche restaurant <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
                >
                  Voir les fonctionnalités
                </a>
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Aperçu — Maison Zayna</div>
                  <div className="font-display text-xl font-semibold mt-1">
                    Performances ce mois-ci
                  </div>
                </div>
                <div className="text-xs rounded-full bg-success/15 text-success px-2.5 py-1 font-medium">
                  +18%
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl bg-secondary/60 p-4">
                    <s.icon className="h-4 w-4 text-primary" />
                    <div className="font-display text-3xl font-semibold mt-2">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            Tout ce qu'il vous faut pour grandir.
          </h2>
          <p className="text-muted-foreground mt-3">Une seule plateforme, tous les outils.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl bg-card border border-border p-6 hover:shadow-soft transition"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features teaser */}
      <section id="fonctionnalites" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 shadow-soft">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Espace restaurateur
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-4">
              Une fiche complète pour présenter votre restaurant.
            </h2>
            <p className="text-muted-foreground mt-3">
              LocalFood permet aux restaurateurs de gérer leur présence locale, leurs photos, leurs
              avis et leurs statistiques. Les options commerciales seront définies plus tard.
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Fiche restaurant",
                desc: "Présentez votre nom, votre cuisine, vos horaires, vos tags, vos liens Maps et votre menu.",
                features: ["Informations générales", "Tags & filtres", "Liens externes"],
              },
              {
                title: "Photos & avis",
                desc: "Mettez en avant vos photos et suivez les avis publiés par vos clients.",
                features: ["Galerie photos", "Photos clients", "Avis publiés"],
              },
              {
                title: "Statistiques",
                desc: "Suivez les vues, les clics itinéraire, les appels, les clics menu et les interactions IA.",
                features: ["Vues de fiche", "Clics Maps/Waze", "Performance IA"],
              },
            ].map((block) => (
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
              Voir l’espace restaurateur <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
            >
              Voir les restaurants
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
