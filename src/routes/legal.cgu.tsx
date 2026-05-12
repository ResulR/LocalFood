import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales d’utilisation — LocalFood" },
      {
        name: "description",
        content: "Conditions générales d’utilisation du site LocalFood.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function TermsPage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            {t("terms.backHome")}
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("terms.badge")}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold">
              {t("terms.title")}
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("terms.intro")}
            </p>

            <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
              <TermsSection title={t("terms.publisherTitle")}>
                <p>{t("terms.publisherText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.accessTitle")}>
                <p>{t("terms.accessText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.publicUseTitle")}>
                <p>{t("terms.publicUseText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.proUseTitle")}>
                <p>{t("terms.proUseText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.accountsTitle")}>
                <p>{t("terms.accountsText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.contentTitle")}>
                <p>{t("terms.contentText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.reviewsTitle")}>
                <p>{t("terms.reviewsText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.aiTitle")}>
                <p>{t("terms.aiText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.availabilityTitle")}>
                <p>{t("terms.availabilityText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.liabilityTitle")}>
                <p>{t("terms.liabilityText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.intellectualPropertyTitle")}>
                <p>{t("terms.intellectualPropertyText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.modificationTitle")}>
                <p>{t("terms.modificationText")}</p>
              </TermsSection>

              <TermsSection title={t("terms.lawTitle")}>
                <p>{t("terms.lawText")}</p>
              </TermsSection>

              <section className="rounded-2xl border border-border bg-secondary/40 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {t("terms.todoTitle")}
                </h2>
                <p className="mt-3">{t("terms.todoText")}</p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
