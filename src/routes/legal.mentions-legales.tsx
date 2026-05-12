import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/legal/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — LocalFood" },
      {
        name: "description",
        content: "Mentions légales du site LocalFood.",
      },
    ],
  }),
  component: LegalNoticePage,
});

function LegalRow({ label, value = "[***]" }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function LegalNoticePage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-gradient-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            {t("legal.backHome")}
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("legal.badge")}
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold">
              {t("legal.title")}
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("legal.intro")}
            </p>

            <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {t("legal.publisherTitle")}
                </h2>
                <dl className="mt-4 grid gap-3">
                  <LegalRow label={t("legal.companyName")} />
                  <LegalRow label={t("legal.legalForm")} />
                  <LegalRow label={t("legal.registrationNumber")} />
                  <LegalRow label={t("legal.address")} />
                  <LegalRow label={t("legal.email")} />
                  <LegalRow label={t("legal.phone")} />
                </dl>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {t("legal.publicationDirectorTitle")}
                </h2>
                <p className="mt-4">[***]</p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {t("legal.hostingTitle")}
                </h2>
                <dl className="mt-4 grid gap-3">
                  <LegalRow label={t("legal.host")} value="OVH SAS" />
                  <LegalRow label={t("legal.hostAddress")} />
                  <LegalRow label={t("legal.hostWebsite")} />
                </dl>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {t("legal.intellectualPropertyTitle")}
                </h2>
                <p className="mt-4">{t("legal.intellectualPropertyText")}</p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {t("legal.contactTitle")}
                </h2>
                <p className="mt-4">{t("legal.contactText")}</p>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {t("legal.todoTitle")}
                </h2>
                <p className="mt-3">{t("legal.todoText")}</p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
