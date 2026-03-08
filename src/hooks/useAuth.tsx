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
    // Retry with backoff to handle auth token propagation timing
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Small delay ensures Supabase internal session is fully propagated before querying
        await new Promise(res => setTimeout(res, 150));
        if (!mounted) return;
        const adminResult = await checkAdminRole(newSession.user.id);
        if (mounted) setIsAdmin(adminResult);
      } else {
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    });

    // Get initial session — triggers onAuthStateChange if session exists
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession && mounted) {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Fallback safety — max 5s
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
