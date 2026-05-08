import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { QUICK_FILTERS } from "@/data/restaurants";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchApiRestaurantById,
  updateOwnedRestaurant,
  updateOwnedRestaurantTags,
  type ApiRestaurantListItem,
  type ApiRestaurantTag,
} from "@/lib/restaurants-api";
import { useAdminI18n } from "@/lib/admin-i18n";

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
  hoursSummary: string;
  menuUrl: string;
  googleMapsUrl: string;
  wazeUrl: string;
};

type ProfileTag = ApiRestaurantTag;

function buildProfileForm(restaurant: ApiRestaurantListItem): ProfileForm {
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
    hoursSummary: restaurant.hours_summary ?? "",
    menuUrl: restaurant.menu_url ?? "",
    googleMapsUrl: restaurant.google_maps_url ?? "",
    wazeUrl: restaurant.waze_url ?? "",
  };
}

export function ProfileEditor() {
  const { tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfileRestaurant() {
      setLoadingRestaurant(true);
      setProfileMessage("");
      setForm(null);
      setTags([]);

      if (loadingRestaurants) {
        return;
      }

      if (!selectedRestaurant) {
        setProfileMessage(restaurantMessage || tAdmin("admin.profile.noRestaurantSelected"));
        setLoadingRestaurant(false);
        return;
      }

      const data = await fetchApiRestaurantById(selectedRestaurant.id);

      if (cancelled) return;

      if (!data) {
        setProfileMessage(tAdmin("admin.profile.loadListingError"));
        setLoadingRestaurant(false);
        return;
      }

      setForm(buildProfileForm(data));
      setTags(data.tags);
      setLoadingRestaurant(false);
    }

    loadProfileRestaurant().catch((error) => {
      console.error("Failed to load profile restaurant from LocalFood API:", error);

      if (!cancelled) {
        setProfileMessage(tAdmin("admin.profile.loadProfileError"));
        setLoadingRestaurant(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const f = form;

  const updateForm = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const toggleTag = (tag: ProfileTag) => {
    setTags((current) =>
      current.some((item) => item.slug === tag.slug)
        ? current.filter((item) => item.slug !== tag.slug)
        : [...current, tag],
    );
  };

  const save = async () => {
    if (!f) {
      toast.error(tAdmin("admin.profile.cannotSave"), {
        description: tAdmin("admin.profile.noRestaurantLoaded"),
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
        hoursSummary: f.hoursSummary,
        menuUrl: f.menuUrl,
        googleMapsUrl: f.googleMapsUrl,
        wazeUrl: f.wazeUrl,
      });

      await updateOwnedRestaurantTags({
        restaurantId: f.restaurantId,
        tagSlugs: tags.map((tag) => tag.slug),
      });

      setSaved(true);
      toast.success(tAdmin("admin.profile.savedTitle"), {
        description: tAdmin("admin.profile.savedDescription"),
      });
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to update restaurant profile:", error);
      toast.error(tAdmin("admin.profile.saveRefused"), {
        description: tAdmin("admin.profile.saveRefusedDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {loadingRestaurant && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {tAdmin("admin.profile.loadingListing")}
        </div>
      )}
      {profileMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {profileMessage}
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">{tAdmin("admin.profile.title")}</h1>
        </div>
        <button
          onClick={save}
          disabled={saving || loadingRestaurant || !f}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />{" "}
          {saving
            ? tAdmin("admin.common.saving")
            : saved
              ? tAdmin("admin.common.saved")
              : tAdmin("admin.common.save")}
        </button>
      </div>

      <Section title={tAdmin("admin.profile.generalInfo")}>
        <Field label={tAdmin("admin.profile.restaurantName")}>
          <input
            value={f?.name ?? ""}
            onChange={(event) => updateForm("name", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tAdmin("admin.profile.category")}>
          <input
            value={f?.category ?? ""}
            onChange={(event) => updateForm("category", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tAdmin("admin.profile.cuisineType")}>
          <input
            value={f?.cuisineType ?? ""}
            onChange={(event) => updateForm("cuisineType", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tAdmin("admin.profile.priceLevel")}>
          <select
            value={f?.priceLabel ?? "€€"}
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
        <Field label={tAdmin("admin.profile.description")} full>
          <textarea
            value={f?.description ?? ""}
            onChange={(event) => updateForm("description", event.target.value)}
            className={`${inputCls} min-h-[110px]`}
          />
        </Field>
      </Section>

      <Section title={tAdmin("admin.profile.contact")}>
        <Field label={tAdmin("admin.profile.address")} full>
          <input
            value={f?.address ?? ""}
            onChange={(event) => updateForm("address", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tAdmin("admin.profile.city")}>
          <input
            value={f?.city ?? ""}
            onChange={(event) => updateForm("city", event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tAdmin("admin.profile.phone")}>
          <input
            value={f?.phone ?? ""}
            onChange={(event) => updateForm("phone", event.target.value)}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title={tAdmin("admin.profile.hoursAndLinks")}>
        <Field label={tAdmin("admin.profile.hoursSummary")} full>
          <input
            value={f?.hoursSummary ?? ""}
            onChange={(event) => updateForm("hoursSummary", event.target.value)}
            className={inputCls}
            placeholder={tAdmin("admin.profile.hoursPlaceholder")}
          />
        </Field>

        <Field label={tAdmin("admin.profile.menuLink")} full>
          <input
            value={f?.menuUrl ?? ""}
            onChange={(event) => updateForm("menuUrl", event.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>

        <Field label={tAdmin("admin.profile.googleMapsLink")} full>
          <input
            value={f?.googleMapsUrl ?? ""}
            onChange={(event) => updateForm("googleMapsUrl", event.target.value)}
            className={inputCls}
            placeholder="https://maps.google.com/..."
          />
        </Field>

        <Field label={tAdmin("admin.profile.wazeLink")} full>
          <input
            value={f?.wazeUrl ?? ""}
            onChange={(event) => updateForm("wazeUrl", event.target.value)}
            className={inputCls}
            placeholder="https://waze.com/..."
          />
        </Field>
      </Section>

      <Section title={tAdmin("admin.profile.tagsFilters")}>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {QUICK_FILTERS.map((label) => {
            const slug = label
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");

            const tag: ProfileTag = { label, slug };
            const selected = tags.some((item) => item.slug === tag.slug);

            return (
              <button
                key={tag.slug}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                  selected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background border-border hover:border-foreground/40"
                }`}
              >
                {label}
              </button>
            );
          })}
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
