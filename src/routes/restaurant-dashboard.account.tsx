import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { deleteMyAccount, exportMyAccountData } from "@/lib/auth-api";
import { useAdminI18n } from "@/lib/admin-i18n";

export const Route = createFileRoute("/restaurant-dashboard/account")({
  component: AccountPage,
});

function downloadJsonFile(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function AccountPage() {
  const navigate = useNavigate();
  const { tAdmin } = useAdminI18n();
  const { profile, role, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const confirmationKeyword = tAdmin("admin.account.deleteConfirmKeyword");
  const canDelete =
    confirmation.trim().toUpperCase() === confirmationKeyword.toUpperCase() &&
    role !== "superadmin";

  const handleExport = async () => {
    setExporting(true);

    try {
      const data = await exportMyAccountData();
      downloadJsonFile(
        `localfood-account-export-${new Date().toISOString().slice(0, 10)}.json`,
        data,
      );
      toast.success(tAdmin("admin.account.exportSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tAdmin("admin.account.exportError"),
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteMyAccount();
      toast.success(tAdmin("admin.account.deleteSuccess"));
      await signOut();
      navigate({ to: "/login" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tAdmin("admin.account.deleteError"),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs font-semibold text-primary uppercase tracking-wider">
          {tAdmin("admin.account.badge")}
        </div>
        <h1 className="font-display text-3xl font-semibold mt-1">
          {tAdmin("admin.account.title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {tAdmin("admin.account.subtitle")}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">
          {tAdmin("admin.account.infoTitle")}
        </h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">{tAdmin("admin.account.email")} : </span>
            <span className="font-medium">
              {profile?.email ?? tAdmin("admin.account.notProvided")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{tAdmin("admin.account.name")} : </span>
            <span className="font-medium">
              {profile?.full_name ?? tAdmin("admin.account.notProvided")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{tAdmin("admin.account.role")} : </span>
            <span className="font-medium">
              {role ?? tAdmin("admin.account.notDefined")}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">
          {tAdmin("admin.account.exportTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {tAdmin("admin.account.exportDescription")}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting
            ? tAdmin("admin.account.exporting")
            : tAdmin("admin.account.exportButton")}
        </button>
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="font-display text-xl font-semibold text-destructive">
          {tAdmin("admin.account.deleteTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {tAdmin("admin.account.deleteDescription")}
        </p>

        {role === "superadmin" && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {tAdmin("admin.account.superAdminBlocked")}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium">
          {tAdmin("admin.account.confirmLabel")}
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={role === "superadmin"}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {deleting
            ? tAdmin("admin.account.deleting")
            : tAdmin("admin.account.deleteButton")}
        </button>
      </section>
    </div>
  );
}
