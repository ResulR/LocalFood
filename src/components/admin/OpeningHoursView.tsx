import { useEffect, useState } from "react";
import { Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRestaurantDashboard } from "@/contexts/RestaurantDashboardContext";
import {
  fetchOwnedRestaurantOpeningHours,
  upsertOwnedRestaurantOpeningHours,
  type OwnedRestaurantOpeningHour,
  type OwnedRestaurantOpeningHourInput,
} from "@/lib/restaurants-api";
import { useAdminI18n, type AdminTranslationKey } from "@/lib/admin-i18n";

type OpeningHourFormRow = {
  day_of_week: number;
  day_label: string;
  hours_text: string;
  is_closed: boolean;
};

const defaultHours: OpeningHourFormRow[] = [
  { day_of_week: 1, day_label: "Lundi", hours_text: "09:00 - 22:00", is_closed: false },
  { day_of_week: 2, day_label: "Mardi", hours_text: "09:00 - 22:00", is_closed: false },
  { day_of_week: 3, day_label: "Mercredi", hours_text: "09:00 - 22:00", is_closed: false },
  { day_of_week: 4, day_label: "Jeudi", hours_text: "09:00 - 22:00", is_closed: false },
  { day_of_week: 5, day_label: "Vendredi", hours_text: "09:00 - 23:00", is_closed: false },
  { day_of_week: 6, day_label: "Samedi", hours_text: "10:00 - 23:00", is_closed: false },
  { day_of_week: 7, day_label: "Dimanche", hours_text: "Fermé", is_closed: true },
];

const DAY_TRANSLATION_KEYS: Record<number, AdminTranslationKey> = {
  1: "admin.openingHours.monday",
  2: "admin.openingHours.tuesday",
  3: "admin.openingHours.wednesday",
  4: "admin.openingHours.thursday",
  5: "admin.openingHours.friday",
  6: "admin.openingHours.saturday",
  7: "admin.openingHours.sunday",
};

function mergeExistingHours(existingHours: OwnedRestaurantOpeningHour[]): OpeningHourFormRow[] {
  const existingByDay = new Map(existingHours.map((hour) => [hour.day_of_week, hour]));

  return defaultHours.map((defaultRow) => {
    const existing = existingByDay.get(defaultRow.day_of_week);

    if (!existing) {
      return defaultRow;
    }

    return {
      day_of_week: existing.day_of_week,
      day_label: existing.day_label,
      hours_text: existing.hours_text,
      is_closed: existing.is_closed,
    };
  });
}

export function OpeningHoursView() {
  const { tAdmin } = useAdminI18n();
  const { selectedRestaurant, loadingRestaurants, restaurantMessage } = useRestaurantDashboard();
  const currentRestaurant = selectedRestaurant;
  const [hours, setHours] = useState<OpeningHourFormRow[]>(defaultHours);
  const [loadingHours, setLoadingHours] = useState(true);
  const [hoursMessage, setHoursMessage] = useState("");
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOpeningHours() {
      setLoadingHours(true);
      setHoursMessage("");
      setHours(defaultHours);

      if (loadingRestaurants) {
        return;
      }

      if (!currentRestaurant) {
        setHoursMessage(restaurantMessage || tAdmin("admin.openingHours.noRestaurantSelected"));
        setLoadingHours(false);
        return;
      }

      const data = await fetchOwnedRestaurantOpeningHours(currentRestaurant.id);

      if (cancelled) return;

      setHours(mergeExistingHours(data));
      setLoadingHours(false);
    }

    loadOpeningHours().catch((error) => {
      console.error("Failed to load restaurant opening hours from LocalFood API:", error);

      if (!cancelled) {
        setHoursMessage(tAdmin("admin.openingHours.loadError"));
        setHours(defaultHours);
        setLoadingHours(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentRestaurant, loadingRestaurants, restaurantMessage, tAdmin]);

  const updateHour = <K extends keyof OpeningHourFormRow>(
    dayOfWeek: number,
    key: K,
    value: OpeningHourFormRow[K],
  ) => {
    setHours((current) =>
      current.map((hour) =>
        hour.day_of_week === dayOfWeek
          ? {
              ...hour,
              [key]: value,
              ...(key === "is_closed" && value === true ? { hours_text: "Fermé" } : {}),
            }
          : hour,
      ),
    );
  };

  const saveHours = async () => {
    if (!currentRestaurant) {
      toast.error(tAdmin("admin.openingHours.saveImpossible"), {
        description: tAdmin("admin.openingHours.noRestaurantLoaded"),
      });
      return;
    }

    setSavingHours(true);

    try {
      const payload: OwnedRestaurantOpeningHourInput[] = hours.map((hour) => ({
        day_of_week: hour.day_of_week,
        day_label: hour.day_label,
        hours_text: hour.is_closed ? "Fermé" : hour.hours_text,
        is_closed: hour.is_closed,
      }));

      const savedHours = await upsertOwnedRestaurantOpeningHours({
        restaurantId: currentRestaurant.id,
        hours: payload,
      });

      setHours(mergeExistingHours(savedHours));

      toast.success(tAdmin("admin.openingHours.savedTitle"), {
        description: tAdmin("admin.openingHours.savedDescription"),
      });
    } catch (error) {
      console.error("Failed to save restaurant opening hours:", error);
      toast.error(tAdmin("admin.openingHours.saveImpossible"), {
        description: tAdmin("admin.openingHours.saveRefusedDescription"),
      });
    } finally {
      setSavingHours(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {loadingHours && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tAdmin("admin.openingHours.loading")}
          </div>
        </div>
      )}

      {hoursMessage && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {hoursMessage}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            {tAdmin("admin.openingHours.badge")}
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {tAdmin("admin.openingHours.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tAdmin("admin.openingHours.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={saveHours}
          disabled={savingHours || loadingHours || !currentRestaurant}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingHours ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {savingHours ? tAdmin("admin.common.saving") : tAdmin("admin.common.save")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">
            {tAdmin("admin.openingHours.byDay")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tAdmin("admin.openingHours.example")}
          </p>
        </div>

        <div className="divide-y divide-border">
          {hours.map((hour) => {
            const dayLabelKey = DAY_TRANSLATION_KEYS[hour.day_of_week];

            return (
              <div
                key={hour.day_of_week}
                className="grid gap-3 p-5 md:grid-cols-[140px_1fr_auto] md:items-center"
              >
                <div className="font-medium">
                  {dayLabelKey ? tAdmin(dayLabelKey) : hour.day_label}
                </div>

                <input
                  value={hour.is_closed ? tAdmin("admin.openingHours.closed") : hour.hours_text}
                  onChange={(event) =>
                    updateHour(hour.day_of_week, "hours_text", event.target.value)
                  }
                  disabled={hour.is_closed}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="09:00 - 22:00"
                />

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={hour.is_closed}
                    onChange={(event) =>
                      updateHour(hour.day_of_week, "is_closed", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  {tAdmin("admin.openingHours.closed")}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
