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
                  href="#tarifs"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
                >
                  Voir les offres
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

      {/* Pricing teaser */}
      <section id="tarifs" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              name: "Gratuit",
              price: "0€",
              desc: "Présence de base sur LocalFood.",
              features: ["Fiche standard", "Coordonnées & horaires", "Visible dans les résultats"],
            },
            {
              name: "Premium",
              price: "29€",
              popular: true,
              desc: "Pour développer votre visibilité locale.",
              features: [
                "Fiche premium",
                "Statistiques détaillées",
                "Photos clients",
                "Avis internes",
                "Mise en avant",
              ],
            },
            {
              name: "Pro",
              price: "59€",
              desc: "Pour les restaurants ambitieux.",
              features: [
                "Tout Premium inclus",
                "Top des résultats",
                "Badge Pro vérifié",
                "Réponses aux avis prioritaires",
                "Support dédié",
              ],
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-7 border ${p.popular ? "border-primary bg-card shadow-elevated relative" : "border-border bg-card"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow-glow">
                  Le plus populaire
                </span>
              )}
              <div className="font-display text-xl font-semibold">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/restaurant-dashboard"
                className={`mt-6 w-full inline-flex justify-center items-center rounded-full px-5 py-3 text-sm font-semibold transition ${p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95" : "border border-border hover:bg-secondary"}`}
              >
                Choisir {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
