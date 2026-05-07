import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearLocalAuthToken,
  getLocalAuthToken,
  setLocalAuthToken,
} from "@/lib/local-auth-token";

export type AppRole = "superadmin" | "admin" | "user";

export type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

type AuthUser = {
  id: string;
  email: string | null;
};

type AuthSession = {
  access_token: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type AuthMeResponse = {
  profile: Profile | null;
  role: AppRole | null;
};

type LocalLoginResponse = {
  token: string;
  profile: Profile | null;
  role: AppRole | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

function buildUserFromProfile(profile: Profile | null): AuthUser | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.user_id,
    email: profile.email,
  };
}

async function fetchAuthMe(accessToken: string) {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: AuthMeResponse;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(
      payload?.message ?? payload?.error ?? "Impossible de charger le profil utilisateur.",
    );
  }

  return payload.data;
}

async function loginWithLocalAuth(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/api/auth/local/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: LocalLoginResponse;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.ok || !payload.data?.token) {
    throw new Error(payload?.message ?? payload?.error ?? "Identifiants invalides.");
  }

  return payload.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthData = useCallback(
    ({
      token,
      nextProfile,
      nextRole,
    }: {
      token: string;
      nextProfile: Profile | null;
      nextRole: AppRole | null;
    }) => {
      setSession({ access_token: token });
      setProfile(nextProfile);
      setRole(nextRole);
      setUser(buildUserFromProfile(nextProfile));
    },
    [],
  );

  const clearAuthData = useCallback(() => {
    clearLocalAuthToken();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getLocalAuthToken();

    if (!token) {
      clearAuthData();
      return;
    }

    const authMe = await fetchAuthMe(token);

    applyAuthData({
      token,
      nextProfile: authMe.profile,
      nextRole: authMe.role,
    });
  }, [applyAuthData, clearAuthData]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setLoading(true);

      const token = getLocalAuthToken();

      if (!token) {
        if (!cancelled) {
          clearAuthData();
          setLoading(false);
        }
        return;
      }

      try {
        const authMe = await fetchAuthMe(token);

        if (!cancelled) {
          applyAuthData({
            token,
            nextProfile: authMe.profile,
            nextRole: authMe.role,
          });
        }
      } catch (error) {
        console.error("Failed to load LocalFood auth user data:", error);

        if (!cancelled) {
          clearAuthData();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [applyAuthData, clearAuthData]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const loginData = await loginWithLocalAuth(email, password);

        setLocalAuthToken(loginData.token);

        applyAuthData({
          token: loginData.token,
          nextProfile: loginData.profile,
          nextRole: loginData.role,
        });

        return {};
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Connexion impossible.",
        };
      }
    },
    [applyAuthData],
  );

  const signOut = useCallback(async () => {
    clearAuthData();
  }, [clearAuthData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      role,
      loading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, role, loading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}