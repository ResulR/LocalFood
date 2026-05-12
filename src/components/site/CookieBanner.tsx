import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const CONSENT_COOKIE_NAME = "lf_consent";
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

type ConsentChoice = "accepted" | "refused";

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

function setConsentCookie(choice: ConsentChoice) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(choice)}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const existingConsent = getCookieValue(CONSENT_COOKIE_NAME);
    setVisible(!existingConsent);
  }, []);

  const saveChoice = (choice: ConsentChoice) => {
    setConsentCookie(choice);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-elevated backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("cookieBanner.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("cookieBanner.description")}</p>
            </div>

            <button
              type="button"
              onClick={() => saveChoice("refused")}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary sm:hidden"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {showDetails && (
            <div className="mt-3 rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-6 text-muted-foreground">
              <p>{t("cookieBanner.detailsTechnical")}</p>
              <p className="mt-2">{t("cookieBanner.detailsNoAnalytics")}</p>
              <p className="mt-2">
                <Link to="/legal/cookies" className="font-medium text-primary hover:underline">
                  {t("cookieBanner.readPolicy")}
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:min-w-64">
          <button
            type="button"
            onClick={() => saveChoice("accepted")}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            {t("cookieBanner.accept")}
          </button>

          <button
            type="button"
            onClick={() => saveChoice("refused")}
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            {t("cookieBanner.refuse")}
          </button>

          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showDetails ? t("cookieBanner.hideDetails") : t("cookieBanner.customize")}
          </button>
        </div>
      </div>
    </div>
  );
}
