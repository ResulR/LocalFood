import { Check, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    features: ["Fiche standard", "Coordonnées & horaires", "Visible dans les résultats"],
  },
  {
    name: "Premium",
    price: "29€",
    current: true,
    popular: true,
    features: [
      "Fiche premium",
      "Statistiques détaillées",
      "Photos clients",
      "Avis internes",
      "Mise en avant",
      "Statistiques IA",
    ],
  },
  {
    name: "Pro",
    price: "59€",
    features: [
      "Tout Premium",
      "Top des résultats",
      "Badge Pro vérifié",
      "Recommandations IA prioritaires",
      "Support dédié",
    ],
  },
];

export function SubscriptionView() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Abonnement</h1>
        <p className="text-muted-foreground mt-1">Gérez votre plan et vos avantages LocalFood.</p>
      </div>

      <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-7 sm:p-9 shadow-elevated relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Plan actuel
            </span>
            <div className="font-display text-3xl font-semibold mt-3">Premium</div>
            <div className="opacity-90 text-sm mt-1">
              Statut : <span className="font-semibold">Actif</span> · Prochaine facturation le 18
              mai 2026
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast("Changement de plan en préparation")}
              className="rounded-full bg-background text-foreground px-5 py-2.5 text-sm font-medium hover:bg-background/90"
            >
              Changer de plan
            </button>
            <button
              onClick={() => toast("Gestion du paiement bientôt disponible")}
              className="rounded-full border border-primary-foreground/40 px-5 py-2.5 text-sm font-medium hover:bg-primary-foreground/10 inline-flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" /> Paiement
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Avantages inclus</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Fiche premium",
            "Statistiques de clics détaillées",
            "Photos clients",
            "Avis internes",
            "Mise en avant dans les résultats",
            "Stats Assistant IA",
          ].map((a) => (
            <div
              key={a}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 text-sm"
            >
              <Check className="h-4 w-4 text-success" /> {a}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Tous les plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 ${p.current ? "border-primary bg-card shadow-soft" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{p.name}</div>
                {p.current && (
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold">
                    Actuel
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  !p.current && toast.success(`Demande de passage au plan ${p.name} enregistrée`)
                }
                className={`mt-5 w-full rounded-full px-4 py-2.5 text-sm font-medium transition ${p.current ? "bg-secondary text-muted-foreground cursor-default" : p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95" : "border border-border hover:bg-secondary"}`}
              >
                {p.current ? "Plan actif" : `Passer à ${p.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
