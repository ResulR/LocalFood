import { Check, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAdminI18n, type AdminTranslationKey } from "@/lib/admin-i18n";

type Plan = {
  nameKey: AdminTranslationKey;
  price: string;
  current?: boolean;
  popular?: boolean;
  features: AdminTranslationKey[];
};

const PLANS: Plan[] = [
  {
    nameKey: "admin.subscription.free",
    price: "0€",
    features: [
      "admin.subscription.featureStandardListing",
      "admin.subscription.featureContactHours",
      "admin.subscription.featureVisibleResults",
    ],
  },
  {
    nameKey: "admin.subscription.premium",
    price: "29€",
    current: true,
    popular: true,
    features: [
      "admin.subscription.featurePremiumListing",
      "admin.subscription.featureDetailedStats",
      "admin.subscription.featureCustomerPhotos",
      "admin.subscription.featureInternalReviews",
      "admin.subscription.featureHighlight",
      "admin.subscription.featureAiStats",
    ],
  },
  {
    nameKey: "admin.subscription.pro",
    price: "59€",
    features: [
      "admin.subscription.featureAllPremium",
      "admin.subscription.featureTopResults",
      "admin.subscription.featureVerifiedPro",
      "admin.subscription.featurePriorityAi",
      "admin.subscription.featureDedicatedSupport",
    ],
  },
];

const INCLUDED_BENEFITS: AdminTranslationKey[] = [
  "admin.subscription.featurePremiumListing",
  "admin.subscription.featureDetailedClickStats",
  "admin.subscription.featureCustomerPhotos",
  "admin.subscription.featureInternalReviews",
  "admin.subscription.featureHighlightedResults",
  "admin.subscription.featureAssistantStats",
];

export function SubscriptionView() {
  const { tAdmin } = useAdminI18n();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          {tAdmin("admin.subscription.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{tAdmin("admin.subscription.subtitle")}</p>
      </div>

      <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-7 sm:p-9 shadow-elevated relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> {tAdmin("admin.subscription.currentPlan")}
            </span>
            <div className="font-display text-3xl font-semibold mt-3">
              {tAdmin("admin.subscription.premium")}
            </div>
            <div className="opacity-90 text-sm mt-1">
              {tAdmin("admin.subscription.status")}{" "}
              <span className="font-semibold">{tAdmin("admin.subscription.active")}</span> ·{" "}
              {tAdmin("admin.subscription.nextBilling")}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast(tAdmin("admin.subscription.changePlanToast"))}
              className="rounded-full bg-background text-foreground px-5 py-2.5 text-sm font-medium hover:bg-background/90"
            >
              {tAdmin("admin.subscription.changePlan")}
            </button>
            <button
              onClick={() => toast(tAdmin("admin.subscription.paymentToast"))}
              className="rounded-full border border-primary-foreground/40 px-5 py-2.5 text-sm font-medium hover:bg-primary-foreground/10 inline-flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" /> {tAdmin("admin.subscription.payment")}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          {tAdmin("admin.subscription.includedBenefits")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {INCLUDED_BENEFITS.map((benefitKey) => (
            <div
              key={benefitKey}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 text-sm"
            >
              <Check className="h-4 w-4 text-success" /> {tAdmin(benefitKey)}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          {tAdmin("admin.subscription.allPlans")}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const planName = tAdmin(p.nameKey);

            return (
              <div
                key={p.nameKey}
                className={`rounded-2xl border p-6 ${p.current ? "border-primary bg-card shadow-soft" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold">{planName}</div>
                  {p.current && (
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold">
                      {tAdmin("admin.subscription.current")}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-semibold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {tAdmin("admin.subscription.perMonth")}
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.features.map((featureKey) => (
                    <li key={featureKey} className="text-sm flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {tAdmin(featureKey)}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    !p.current &&
                    toast.success(
                      `${tAdmin("admin.subscription.switchToastBefore")} ${planName} ${tAdmin("admin.subscription.switchToastAfter")}`,
                    )
                  }
                  className={`mt-5 w-full rounded-full px-4 py-2.5 text-sm font-medium transition ${p.current ? "bg-secondary text-muted-foreground cursor-default" : p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95" : "border border-border hover:bg-secondary"}`}
                >
                  {p.current
                    ? tAdmin("admin.subscription.activePlan")
                    : `${tAdmin("admin.subscription.switchTo")} ${planName}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
