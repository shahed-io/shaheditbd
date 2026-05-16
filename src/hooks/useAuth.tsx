import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendLoginNotification } from '@/lib/loginNotifier';

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
  const [loading, setLoading] = useState(true); // Start true — wait for initial session check

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise(res => setTimeout(res, 500 * attempt));
      }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (!error) return !!data;
        console.warn(`Admin check attempt ${attempt + 1} failed:`, error.message);
      } catch (e) {
        console.warn(`Admin check attempt ${attempt + 1} exception:`, e);
      }
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    // IMPORTANT: Do NOT use async/await directly in onAuthStateChange callback
    // as it can cause Supabase client deadlocks. Use .then() chains instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const userId = newSession.user.id;
        // Defer the role check outside the callback to avoid deadlock
        setTimeout(() => {
          if (!mounted) return;
          checkAdminRole(userId).then(isAdminResult => {
            if (mounted) {
              setIsAdmin(isAdminResult);
              setLoading(false);
            }
          });
        }, 0);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession && mounted) {
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
