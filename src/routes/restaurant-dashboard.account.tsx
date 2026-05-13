import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { deleteMyAccount, exportMyAccountData } from "@/lib/auth-api";

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
  const { profile, role, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const canDelete = confirmation.trim().toUpperCase() === "SUPPRIMER" && role !== "superadmin";

  const handleExport = async () => {
    setExporting(true);

    try {
      const data = await exportMyAccountData();
      downloadJsonFile(`localfood-account-export-${new Date().toISOString().slice(0, 10)}.json`, data);
      toast.success("Export généré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible.");
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
      toast.success("Compte désactivé");
      await signOut();
      navigate({ to: "/login" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs font-semibold text-primary uppercase tracking-wider">
          RGPD
        </div>
        <h1 className="font-display text-3xl font-semibold mt-1">Mon compte</h1>
        <p className="text-muted-foreground mt-2">
          Exportez vos données ou demandez la désactivation de votre compte LocalFood.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Informations du compte</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Email : </span>
            <span className="font-medium">{profile?.email ?? "Non renseigné"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Nom : </span>
            <span className="font-medium">{profile?.full_name ?? "Non renseigné"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Rôle : </span>
            <span className="font-medium">{role ?? "Non défini"}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Exporter mes données</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Téléchargez un fichier JSON contenant les principales données liées à votre compte,
          vos rôles, entreprises et restaurants associés.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Export en cours..." : "Exporter mes données"}
        </button>
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="font-display text-xl font-semibold text-destructive">
          Supprimer mon compte
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Cette action désactive votre compte, bloque les futures connexions et enregistre une
          demande de suppression. La purge/anonymisation définitive devra être traitée après
          vérification, notamment pour les obligations légales, sécurité et facturation.
        </p>

        {role === "superadmin" && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Un compte SuperAdmin ne peut pas être supprimé depuis l’interface. Utilisez une
            procédure manuelle contrôlée.
          </div>
        )}

        <label className="mt-5 block text-sm font-medium">
          Tapez SUPPRIMER pour confirmer
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
          {deleting ? "Suppression en cours..." : "Supprimer mon compte"}
        </button>
      </section>
    </div>
  );
}
