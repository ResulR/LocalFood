import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "superadmin" | "admin" | "user";

export type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  current_company_id: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const apiBaseUrl = import.meta.env.VITE_LOCALFOOD_API_URL ?? "http://localhost:4000";

type AuthMeResponse = {
  profile: Profile | null;
  role: AppRole | null;
};

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
  } | null;

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.message ?? "Impossible de charger le profil utilisateur.");
  }

  return payload.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.access_token) {
      setProfile(null);
      setRole(null);
      return;
    }

    const authMe = await fetchAuthMe(nextSession.access_token);

    setProfile(authMe.profile);
    setRole(authMe.role);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    await loadUserData(session);
  }, [loadUserData, session, user]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setLoading(true);

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Failed to get auth session:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      try {
        await loadUserData(currentSession);
      } catch (loadError) {
        console.error("Failed to load auth user data:", loadError);
        setProfile(null);
        setRole(null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(true);

      window.setTimeout(() => {
        loadUserData(nextSession)
          .catch((error) => {
            console.error("Failed to refresh auth user data:", error);
            setProfile(null);
            setRole(null);
          })
          .finally(() => {
            setLoading(false);
          });
      }, 0);
    });

    initAuth();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

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
