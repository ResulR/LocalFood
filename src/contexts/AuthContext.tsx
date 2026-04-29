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

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        user_id,
        email,
        full_name,
        is_active,
        current_company_id
      `,
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

async function fetchRole(userId: string) {
  const { data, error } = await supabase.rpc("get_user_role", {
    _user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data as AppRole | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      setRole(null);
      return;
    }

    const [nextProfile, nextRole] = await Promise.all([
      fetchProfile(nextUser.id),
      fetchRole(nextUser.id),
    ]);

    setProfile(nextProfile);
    setRole(nextRole);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    await loadUserData(user);
  }, [loadUserData, user]);

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
        await loadUserData(currentSession?.user ?? null);
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
        loadUserData(nextSession?.user ?? null)
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
