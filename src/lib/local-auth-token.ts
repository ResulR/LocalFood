const LOCALFOOD_AUTH_TOKEN_KEY = "localfood-auth-token";

export function getLocalAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LOCALFOOD_AUTH_TOKEN_KEY);
}

export function setLocalAuthToken(token: string) {
  window.localStorage.setItem(LOCALFOOD_AUTH_TOKEN_KEY, token);
}

export function clearLocalAuthToken() {
  window.localStorage.removeItem(LOCALFOOD_AUTH_TOKEN_KEY);
}

export function getLocalAuthHeaders() {
  const token = getLocalAuthToken();

  if (!token) {
    throw new Error("Session LocalFood introuvable.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}