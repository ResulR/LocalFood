import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — LocalFood" },
      {
        name: "description",
        content: "Politique de confidentialité et informations RGPD du site LocalFood.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            {t("privacy.backHome")}
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("privacy.badge")}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold">
              {t("privacy.title")}
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("privacy.intro")}
            </p>

            <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
              <PrivacySection title={t("privacy.controllerTitle")}>
                <p>{t("privacy.controllerText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.dataTitle")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("privacy.dataAccount")}</li>
                  <li>{t("privacy.dataFavorites")}</li>
                  <li>{t("privacy.dataLocation")}</li>
                  <li>{t("privacy.dataReviews")}</li>
                  <li>{t("privacy.dataInteractions")}</li>
                  <li>{t("privacy.dataAi")}</li>
                </ul>
              </PrivacySection>

              <PrivacySection title={t("privacy.purposesTitle")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("privacy.purposeService")}</li>
                  <li>{t("privacy.purposeAdmin")}</li>
                  <li>{t("privacy.purposeSecurity")}</li>
                  <li>{t("privacy.purposeStats")}</li>
                  <li>{t("privacy.purposeAi")}</li>
                </ul>
              </PrivacySection>

              <PrivacySection title={t("privacy.locationTitle")}>
                <p>{t("privacy.locationText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.localStorageTitle")}>
                <p>{t("privacy.localStorageText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.processorsTitle")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("privacy.processorHosting")}</li>
                  <li>{t("privacy.processorOpenAi")}</li>
                  <li>{t("privacy.processorEmail")}</li>
                  <li>{t("privacy.processorMonitoring")}</li>
                </ul>
              </PrivacySection>

              <PrivacySection title={t("privacy.retentionTitle")}>
                <p>{t("privacy.retentionText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.rightsTitle")}>
                <p>{t("privacy.rightsText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.securityTitle")}>
                <p>{t("privacy.securityText")}</p>
              </PrivacySection>

              <PrivacySection title={t("privacy.contactTitle")}>
                <p>{t("privacy.contactText")}</p>
              </PrivacySection>

              <section className="rounded-2xl border border-border bg-secondary/40 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {t("privacy.todoTitle")}
                </h2>
                <p className="mt-3">{t("privacy.todoText")}</p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
