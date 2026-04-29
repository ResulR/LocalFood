import { useState } from "react";
import { Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { restaurants, QUICK_FILTERS } from "@/data/restaurants";

export function ProfileEditor() {
  const r = restaurants[0];
  const [tags, setTags] = useState<string[]>(r.tags);
  const [saved, setSaved] = useState(false);
  const toggle = (t: string) =>
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);
  const save = () => {
    setSaved(true);
    toast.success("Fiche enregistrée", {
      description: "Vos modifications ont bien été prises en compte dans cette session.",
    });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Ma fiche restaurant</h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les informations affichées aux clients.
          </p>
        </div>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          <Save className="h-4 w-4" /> {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </div>

      <Section title="Informations générales">
        <Field label="Nom du restaurant">
          <input defaultValue={r.name} className={inputCls} />
        </Field>
        <Field label="Catégorie">
          <input defaultValue={r.category} className={inputCls} />
        </Field>
        <Field label="Type de cuisine">
          <input defaultValue={r.cuisineType} className={inputCls} />
        </Field>
        <Field label="Niveau de prix">
          <select defaultValue={r.price} className={inputCls}>
            <option>€</option>
            <option>€€</option>
            <option>€€€</option>
          </select>
        </Field>
        <Field label="Description" full>
          <textarea defaultValue={r.description} className={`${inputCls} min-h-[110px]`} />
        </Field>
      </Section>

      <Section title="Coordonnées">
        <Field label="Adresse" full>
          <input defaultValue={r.address} className={inputCls} />
        </Field>
        <Field label="Téléphone">
          <input defaultValue={r.phone} className={inputCls} />
        </Field>
        <Field label="Horaires">
          <input defaultValue={r.hours} className={inputCls} />
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
