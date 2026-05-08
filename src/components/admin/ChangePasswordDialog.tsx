import { useState } from "react";
import { KeyRound, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { changeLocalPassword } from "@/lib/auth-api";
import { useAdminI18n } from "@/lib/admin-i18n";

export function ChangePasswordDialog() {
  const { tAdmin } = useAdminI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirmation("");
  };

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    setIsOpen(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== newPasswordConfirmation) {
      toast.error(tAdmin("admin.password.confirmationMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      await changeLocalPassword({
        currentPassword,
        newPassword,
      });

      toast.success(tAdmin("admin.password.changed"));
      resetForm();
      setIsOpen(false);
    } catch (error) {
      toast.error(tAdmin("admin.password.changeError"), {
        description:
          error instanceof Error ? error.message : tAdmin("admin.password.changeErrorDescription"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
        title={tAdmin("admin.password.open")}
        aria-label={tAdmin("admin.password.open")}
      >
        <KeyRound className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[min(90vw,360px)] rounded-2xl border border-border bg-card p-4 shadow-elevated">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold">
                {tAdmin("admin.password.title")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {tAdmin("admin.password.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
              aria-label={tAdmin("admin.password.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                {tAdmin("admin.password.current")}
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                {tAdmin("admin.password.new")}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                {tAdmin("admin.password.confirm")}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPasswordConfirmation}
                onChange={(event) => setNewPasswordConfirmation(event.target.value)}
                required
                minLength={8}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? tAdmin("admin.password.saving") : tAdmin("admin.password.save")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
