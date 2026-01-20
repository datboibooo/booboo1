"use client";

import * as React from "react";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && url !== "your_supabase_url" && url.includes("supabase"));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConfigured, setIsConfigured] = React.useState(false);

  React.useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    // If Supabase isn't configured, just set loading to false
    if (!configured) {
      setIsLoading(false);
      return;
    }

    // Dynamically import to avoid build errors when not configured
    import("./client").then(({ createClient }) => {
      try {
        const supabase = createClient();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const signInWithEmail = async (email: string) => {
    if (!isConfigured) {
      return { error: new Error("Auth not configured. Add Supabase environment variables.") };
    }

    try {
      const { createClient } = await import("./client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    if (!isConfigured) return;

    try {
      const { createClient } = await import("./client");
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch {
      // Ignore errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
