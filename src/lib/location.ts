export type UserLocation = {
  latitude: number;
  longitude: number;
  savedAt: string;
};

export type LocationDismissReason = "later" | "denied" | "unavailable" | "error";

export type LocationDismissal = {
  dismissedAt: string;
  reason: LocationDismissReason;
};

const USER_LOCATION_KEY = "localfood:user-location";
const LOCATION_DISMISSED_KEY = "localfood:location-dismissed";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined";
}

function isFresh(isoDate: string, maxAgeMs = ONE_DAY_MS) {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= maxAgeMs;
}

export function isUserLocationFresh(location: UserLocation | null) {
  if (!location) {
    return false;
  }

  return isFresh(location.savedAt);
}

export function getSavedUserLocation(): UserLocation | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_LOCATION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<UserLocation>;

    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      typeof parsed.savedAt !== "string"
    ) {
      clearUserLocation();
      return null;
    }

    const location: UserLocation = {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      savedAt: parsed.savedAt,
    };

    if (!isUserLocationFresh(location)) {
      clearUserLocation();
      return null;
    }

    return location;
  } catch {
    clearUserLocation();
    return null;
  }
}

export function saveUserLocation(latitude: number, longitude: number) {
  if (!isBrowser()) {
    return;
  }

  const location: UserLocation = {
    latitude,
    longitude,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(location));
  window.localStorage.removeItem(LOCATION_DISMISSED_KEY);
}

export function clearUserLocation() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_LOCATION_KEY);
}

export function hasDismissedLocationPrompt() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(LOCATION_DISMISSED_KEY);

    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as Partial<LocationDismissal>;

    if (typeof parsed.dismissedAt !== "string") {
      window.localStorage.removeItem(LOCATION_DISMISSED_KEY);
      return false;
    }

    if (!isFresh(parsed.dismissedAt)) {
      window.localStorage.removeItem(LOCATION_DISMISSED_KEY);
      return false;
    }

    return true;
  } catch {
    window.localStorage.removeItem(LOCATION_DISMISSED_KEY);
    return false;
  }
}

export function dismissLocationPrompt(reason: LocationDismissReason) {
  if (!isBrowser()) {
    return;
  }

  const dismissal: LocationDismissal = {
    dismissedAt: new Date().toISOString(),
    reason,
  };

  window.localStorage.setItem(LOCATION_DISMISSED_KEY, JSON.stringify(dismissal));
}

export function calculateDistanceKm(
  from: Pick<UserLocation, "latitude" | "longitude">,
  to: Pick<UserLocation, "latitude" | "longitude">,
) {
  const earthRadiusKm = 6371;

  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 10) / 10;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
