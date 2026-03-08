import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    // Retry with backoff to handle token propagation timing
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        await new Promise(res => setTimeout(res, 300 * attempt));
      }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (!error) {
          return !!data;
        }
        console.warn(`Admin check attempt ${attempt + 1} failed:`, error.message);
      } catch (e) {
        console.warn(`Admin check attempt ${attempt + 1} exception:`, e);
      }
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Small delay ensures Supabase internal session is fully propagated before querying
        await new Promise(res => setTimeout(res, 100));
        if (!mounted) return;
        const adminResult = await checkAdminRole(session.user.id);
        if (mounted) setIsAdmin(adminResult);
      } else {
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && mounted) {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Fallback safety
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string, accessToken?: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(res => setTimeout(res, 400 * attempt));
        }
        // Use explicit auth header if provided to avoid race condition
        const client = accessToken
          ? supabase.auth.setSession({ access_token: accessToken, refresh_token: '' }).then(() => supabase)
          : Promise.resolve(supabase);
        const sb = await client;
        const { data, error } = await sb
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (!error) return !!data;
      } catch {
        // continue to retry
      }
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const adminResult = await checkAdminRole(session.user.id);
        if (mounted) setIsAdmin(adminResult);
      } else {
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && mounted) {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Fallback safety — max 3s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
