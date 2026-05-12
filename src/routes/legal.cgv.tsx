import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions générales de vente — LocalFood" },
      {
        name: "description",
        content: "Conditions générales de vente des offres professionnelles LocalFood.",
      },
    ],
  }),
  component: SalesTermsPage,
});

function SalesTermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function SalesTermsPage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            {t("salesTerms.backHome")}
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("salesTerms.badge")}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold">
              {t("salesTerms.title")}
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("salesTerms.intro")}
            </p>

            <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
              <SalesTermsSection title={t("salesTerms.sellerTitle")}>
                <p>{t("salesTerms.sellerText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.scopeTitle")}>
                <p>{t("salesTerms.scopeText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.offersTitle")}>
                <p>{t("salesTerms.offersText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.pricesTitle")}>
                <p>{t("salesTerms.pricesText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.subscriptionTitle")}>
                <p>{t("salesTerms.subscriptionText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.paymentTitle")}>
                <p>{t("salesTerms.paymentText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.activationTitle")}>
                <p>{t("salesTerms.activationText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.cancellationTitle")}>
                <p>{t("salesTerms.cancellationText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.withdrawalTitle")}>
                <p>{t("salesTerms.withdrawalText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.customerObligationsTitle")}>
                <p>{t("salesTerms.customerObligationsText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.suspensionTitle")}>
                <p>{t("salesTerms.suspensionText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.liabilityTitle")}>
                <p>{t("salesTerms.liabilityText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.dataTitle")}>
                <p>{t("salesTerms.dataText")}</p>
              </SalesTermsSection>

              <SalesTermsSection title={t("salesTerms.lawTitle")}>
                <p>{t("salesTerms.lawText")}</p>
              </SalesTermsSection>

              <section className="rounded-2xl border border-border bg-secondary/40 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {t("salesTerms.todoTitle")}
                </h2>
                <p className="mt-3">{t("salesTerms.todoText")}</p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
