import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Politique cookies — LocalFood" },
      {
        name: "description",
        content: "Politique cookies et stockage local du site LocalFood.",
      },
    ],
  }),
  component: CookiesPage,
});

function CookieSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function CookiesPage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            {t("cookies.backHome")}
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("cookies.badge")}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold">
              {t("cookies.title")}
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("cookies.intro")}
            </p>

            <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
              <CookieSection title={t("cookies.whatTitle")}>
                <p>{t("cookies.whatText")}</p>
              </CookieSection>

              <CookieSection title={t("cookies.currentTitle")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("cookies.currentAuthStorage")}</li>
                  <li>{t("cookies.currentLanguageStorage")}</li>
                  <li>{t("cookies.currentFavoritesStorage")}</li>
                  <li>{t("cookies.currentLocationStorage")}</li>
                  <li>{t("cookies.currentDashboardStorage")}</li>
                  <li>{t("cookies.currentSidebarCookie")}</li>
                </ul>
              </CookieSection>

              <CookieSection title={t("cookies.futureTitle")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("cookies.futureAuthCookie")}</li>
                  <li>{t("cookies.futureCsrfCookie")}</li>
                </ul>
              </CookieSection>

              <CookieSection title={t("cookies.analyticsTitle")}>
                <p>{t("cookies.analyticsText")}</p>
              </CookieSection>

              <CookieSection title={t("cookies.purposeTitle")}>
                <p>{t("cookies.purposeText")}</p>
              </CookieSection>

              <CookieSection title={t("cookies.manageTitle")}>
                <p>{t("cookies.manageText")}</p>
              </CookieSection>

              <CookieSection title={t("cookies.contactTitle")}>
                <p>{t("cookies.contactText")}</p>
              </CookieSection>

              <section className="rounded-2xl border border-border bg-secondary/40 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {t("cookies.todoTitle")}
                </h2>
                <p className="mt-3">{t("cookies.todoText")}</p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
