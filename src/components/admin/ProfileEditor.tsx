import { useEffect, useState } from "react";
import { Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  restaurants as localRestaurants,
  QUICK_FILTERS,
  type Restaurant,
} from "@/data/restaurants";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchSupabaseRestaurantById,
  fetchSupabaseRestaurantsByCompanyId,
  updateOwnedRestaurant,
  type SupabaseRestaurantListItem,
} from "@/lib/restaurants-api";
import { mapSupabaseRestaurantToRestaurant } from "@/lib/restaurant-mappers";

type ProfileForm = {
  restaurantId: string;
  name: string;
  category: string;
  cuisineType: string;
  description: string;
  priceLabel: "€" | "€€" | "€€€";
  isOpen: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
  isActive: boolean;
};

function buildProfileForm(restaurant: SupabaseRestaurantListItem): ProfileForm {
  return {
    restaurantId: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    cuisineType: restaurant.cuisine_type,
    description: restaurant.description,
    priceLabel: restaurant.price_label,
    isOpen: restaurant.is_open,
    address: restaurant.address,
    city: restaurant.city,
    country: restaurant.country,
    phone: restaurant.phone ?? "",
    isActive: restaurant.is_active,
  };
}

export function ProfileEditor() {
  const { profile } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant>(localRestaurants[0]);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [tags, setTags] = useState<string[]>(localRestaurants[0].tags);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfileRestaurant() {
      setLoadingRestaurant(true);
      setProfileMessage("");

      if (!profile?.current_company_id) {
        setProfileMessage("Aucune entreprise n’est liée à votre profil.");
        setLoadingRestaurant(false);
        return;
      }

      const restaurants = await fetchSupabaseRestaurantsByCompanyId(profile.current_company_id);
      const companyRestaurant = restaurants[0] ?? null;

      if (cancelled) return;

      if (!companyRestaurant) {
        setProfileMessage("Aucun restaurant n’est encore lié à votre entreprise.");
        setLoadingRestaurant(false);
        return;
      }

      const data = await fetchSupabaseRestaurantById(companyRestaurant.id);

      if (cancelled) return;

      if (!data) {
        setProfileMessage("Impossible de charger la fiche de ce restaurant.");
        setLoadingRestaurant(false);
        return;
      }

      const mapped = mapSupabaseRestaurantToRestaurant(data);
      setRestaurant(mapped);
      setForm(buildProfileForm(data));
      setTags(mapped.tags);
      setLoadingRestaurant(false);
    }

    loadProfileRestaurant().catch((error) => {
      console.error("Failed to load profile restaurant from Supabase:", error);

      if (!cancelled) {
        setProfileMessage("Impossible de charger la fiche restaurant.");
        setLoadingRestaurant(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.current_company_id]);

  const r = restaurant;
  const f = form;

  const updateForm = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const toggle = (t: string) =>
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);

  const save = async () => {
    if (!f) {
      toast.error("Impossible d’enregistrer", {
        description: "Aucun restaurant n’est chargé.",
      });
      return;
    }

    setSaving(true);

    try {
      await updateOwnedRestaurant({
        restaurantId: f.restaurantId,
        name: f.name,
        category: f.category,
        cuisineType: f.cuisineType,
        description: f.description,
        priceLabel: f.priceLabel,
        isOpen: f.isOpen,
        address: f.address,
        city: f.city,
        country: f.country,
        phone: f.phone,
        isActive: f.isActive,
      });

      setSaved(true);
      toast.success("Fiche enregistrée", {
        description: "Les informations principales ont été sauvegardées en base.",
      });
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to update restaurant profile:", error);
      toast.error("Enregistrement impossible", {
        description: "La base de données a refusé la modification.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {loadingRestaurant && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Chargement de la fiche restaurant...
        </div>
      )}
      {profileMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {profileMessage}
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Ma fiche restaurant</h1>
        </div>
        <button
          onClick={save}
          disabled={saving || loadingRestaurant || !f}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />{" "}
          {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </div>

      <Section title="Informations générales">
        <Field label="Nom du restaurant">
          <input
            value={f?.name ?? r.name}
            onChange={(event) => updateForm("name", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Catégorie">
          <input
            value={f?.category ?? r.category}
            onChange={(event) => updateForm("category", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Type de cuisine">
          <input
            value={f?.cuisineType ?? r.cuisineType}
            onChange={(event) => updateForm("cuisineType", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Niveau de prix">
          <select
            value={f?.priceLabel ?? r.price}
            onChange={(event) =>
              updateForm("priceLabel", event.target.value as ProfileForm["priceLabel"])
            }
            className={inputCls}
          >
            <option>€</option>
            <option>€€</option>
            <option>€€€</option>
          </select>
        </Field>
        <Field label="Description" full>
          <textarea
            value={f?.description ?? r.description}
            onChange={(event) => updateForm("description", event.target.value)}
            className={`${inputCls} min-h-[110px]`}
          />
        </Field>
      </Section>

      <Section title="Coordonnées">
        <Field label="Adresse" full>
          <input
            value={f?.address ?? r.address}
            onChange={(event) => updateForm("address", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Ville">
          <input
            value={f?.city ?? r.city}
            onChange={(event) => updateForm("city", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Téléphone">
          <input
            value={f?.phone ?? r.phone}
            onChange={(event) => updateForm("phone", event.target.value)}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Tags & filtres">
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {QUICK_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${tags.includes(t) ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Liens externes">
        <Field label="Lien Google Maps">
          <input defaultValue={r.googleMapsUrl} className={inputCls} />
        </Field>
        <Field label="Lien Waze">
          <input defaultValue={r.wazeUrl} className={inputCls} />
        </Field>
        <Field label="Lien menu" full>
          <input defaultValue={r.menuUrl} className={inputCls} />
        </Field>
      </Section>

      <Section title="Photos">
        <div className="md:col-span-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {r.gallery.map((g, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
              >
                <img src={g} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => toast("Photo supprimée")}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => toast.success("Photo ajoutée")}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-foreground/40 inline-flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition"
            >
              <Upload className="h-5 w-5" /> <span className="text-xs">Ajouter</span>
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border border-border p-6">
      <h2 className="font-display text-lg font-semibold mb-5">{title}</h2>
      <div className="grid md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

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
