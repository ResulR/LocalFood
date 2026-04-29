import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Loader2, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchOwnedRestaurantOffers,
  updateOwnedRestaurantOfferStatus,
  upsertOwnedRestaurantOffer,
  type OwnedRestaurantOffer,
} from "@/lib/restaurants-api";

type OfferForm = {
  offerId: string | null;
  code: string;
  title: string;
  description: string;
  conditions: string;
  isActive: boolean;
};

const emptyForm: OfferForm = {
  offerId: null,
  code: "",
  title: "",
  description: "",
  conditions: "",
  isActive: true,
};

export function OffersView() {
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [offers, setOffers] = useState<OwnedRestaurantOffer[]>([]);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offersMessage, setOffersMessage] = useState("");
  const [savingOffer, setSavingOffer] = useState(false);
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOffers() {
      setLoadingOffers(true);
      setOffersMessage("");
      setOffers([]);
      resetForm();

      if (loadingRestaurants) {
        return;
      }

      if (!currentRestaurant) {
        setOffersMessage(restaurantMessage || "Aucun restaurant n’est sélectionné.");
        setLoadingOffers(false);
        return;
      }

      const data = await fetchOwnedRestaurantOffers(currentRestaurant.id);

      if (cancelled) return;

      setOffers(data);
      setLoadingOffers(false);
    }

    loadOffers().catch((error) => {
      console.error("Failed to load restaurant offers from Supabase:", error);

      if (!cancelled) {
        setOffersMessage("Impossible de charger les offres.");
        setOffers([]);
        setLoadingOffers(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage]);

  const activeOffersCount = useMemo(
    () => offers.filter((offer) => offer.is_active).length,
    [offers],
  );

  const updateForm = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const editOffer = (offer: OwnedRestaurantOffer) => {
    setForm({
      offerId: offer.id,
      code: offer.code,
      title: offer.title,
      description: offer.description,
      conditions: offer.conditions ?? "",
      isActive: offer.is_active,
    });
  };

  const saveOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentRestaurant) {
      toast.error("Enregistrement impossible", {
        description: "Aucun restaurant n’est chargé.",
      });
      return;
    }

    setSavingOffer(true);

    try {
      const savedRows = await upsertOwnedRestaurantOffer({
        offerId: form.offerId,
        restaurantId: currentRestaurant.id,
        code: form.code,
        title: form.title,
        description: form.description,
        conditions: form.conditions,
        isActive: form.isActive,
      });

      const savedOffer = savedRows[0];

      if (savedOffer) {
        setOffers((current) => {
          const exists = current.some((offer) => offer.id === savedOffer.id);

          if (!exists) {
            return [savedOffer, ...current];
          }

          return current.map((offer) => (offer.id === savedOffer.id ? savedOffer : offer));
        });
      }

      toast.success(form.offerId ? "Offre modifiée" : "Offre ajoutée", {
        description: "L’offre a été sauvegardée en base.",
      });

      resetForm();
    } catch (error) {
      console.error("Failed to save restaurant offer:", error);
      toast.error("Enregistrement impossible", {
        description: "La base de données a refusé la modification.",
      });
    } finally {
      setSavingOffer(false);
    }
  };

  const toggleOfferStatus = async (offer: OwnedRestaurantOffer) => {
    setUpdatingOfferId(offer.id);

    try {
      const updatedRows = await updateOwnedRestaurantOfferStatus({
        offerId: offer.id,
        isActive: !offer.is_active,
      });

      const updated = updatedRows[0];

      setOffers((current) =>
        current.map((item) =>
          item.id === offer.id
            ? {
                ...item,
                is_active: updated ? updated.is_active : !offer.is_active,
                updated_at: updated ? updated.updated_at : item.updated_at,
              }
            : item,
        ),
      );

      toast.success(updated?.is_active ? "Offre activée" : "Offre désactivée");
    } catch (error) {
      console.error("Failed to update restaurant offer status:", error);
      toast.error("Modification impossible", {
        description: "La base de données a refusé la modification.",
      });
    } finally {
      setUpdatingOfferId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      {loadingOffers && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des offres...
          </div>
        </div>
      )}

      {offersMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {offersMessage}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <BadgePercent className="h-3.5 w-3.5" />
            Offres restaurant
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Offres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez et gérez les offres visibles sur la fiche publique du restaurant.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="text-xs text-muted-foreground">Offres actives</div>
          <div className="font-display text-2xl font-semibold">{activeOffersCount}</div>
        </div>
      </div>

      <form onSubmit={saveOffer} className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">
            {form.offerId ? "Modifier une offre" : "Ajouter une offre"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code promo">
            <input
              value={form.code}
              onChange={(event) => updateForm("code", event.target.value)}
              required
              className={inputCls}
              placeholder="Ex : LOCAL10"
            />
          </Field>

          <Field label="Titre">
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              required
              className={inputCls}
              placeholder="Ex : -10% sur votre première commande"
            />
          </Field>

          <Field label="Description" full>
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              required
              className={`${inputCls} min-h-[90px]`}
              placeholder="Expliquez clairement l’offre au client."
            />
          </Field>

          <Field label="Conditions" full>
            <textarea
              value={form.conditions}
              onChange={(event) => updateForm("conditions", event.target.value)}
              className={`${inputCls} min-h-[70px]`}
              placeholder="Ex : Valable uniquement sur place, hors boissons."
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Offre active
          </label>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {form.offerId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Annuler
            </button>
          )}

          <button
            type="submit"
            disabled={savingOffer || !currentRestaurant}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingOffer && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingOffer ? "Enregistrement..." : form.offerId ? "Modifier l’offre" : "Ajouter"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Offres existantes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Une offre inactive n’est pas affichée publiquement.
          </p>
        </div>

        {offers.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Aucune offre n’est encore créée pour ce restaurant.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {offers.map((offer) => {
              const isUpdating = updatingOfferId === offer.id;

              return (
                <div key={offer.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            offer.is_active
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {offer.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                          {offer.code}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-xl font-semibold">{offer.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>

                      {offer.conditions && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Conditions : {offer.conditions}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editOffer(offer)}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleOfferStatus(offer)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        {offer.is_active ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
