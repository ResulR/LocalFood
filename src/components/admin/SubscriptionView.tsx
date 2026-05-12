import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { useAdminI18n } from "@/lib/admin-i18n";

export function SubscriptionView() {
  const { tAdmin } = useAdminI18n();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          {tAdmin("admin.subscription.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {tAdmin("admin.subscription.comingSoonSubtitle")}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-7 sm:p-10 shadow-soft">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="h-7 w-7" />
        </div>

        <h2 className="mt-6 font-display text-3xl font-semibold">
          {tAdmin("admin.subscription.comingSoonTitle")}
        </h2>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          {tAdmin("admin.subscription.comingSoonDescription")}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {tAdmin("admin.subscription.futurePlansTitle")}
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {tAdmin("admin.subscription.futurePlansText")}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {tAdmin("admin.subscription.futurePaymentsTitle")}
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {tAdmin("admin.subscription.futurePaymentsText")}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {tAdmin("admin.subscription.noActiveBillingTitle")}
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {tAdmin("admin.subscription.noActiveBillingText")}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-5 text-sm leading-7 text-muted-foreground">
          <strong className="text-foreground">
            {tAdmin("admin.subscription.importantNoticeTitle")}
          </strong>{" "}
          {tAdmin("admin.subscription.importantNoticeText")}
        </div>
      </div>
    </div>
  );
}
