'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import Login from './Login';
import AuthTransition from './AuthTransition';

type Profile = {
  id: string;
  role: 'QA' | 'dev' | 'leader' | 'admin' | 'Administrator' | string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitionType, setTransitionType] = useState<'login' | 'logout' | null>(null);
  const prevUserRef = useRef<User | null>(null);
  const hasResolvedOnceRef = useRef(false);

  // Detecta transiciones reales de sesión (no el estado inicial al cargar
  // la página) para disparar la animación de acceso/salida correspondiente.
  // useLayoutEffect (no useEffect): debe montar el overlay ANTES de que el
  // navegador pinte, si no se alcanza a ver el dashboard un instante primero.
  useLayoutEffect(() => {
    if (loading) return;

    if (!hasResolvedOnceRef.current) {
      hasResolvedOnceRef.current = true;
      prevUserRef.current = user;
      return;
    }

    const prevUser = prevUserRef.current;
    if (!prevUser && user) {
      setTransitionType('login');
    } else if (prevUser && !user) {
      setTransitionType('logout');
    }
    prevUserRef.current = user;
  }, [user, loading]);

  useEffect(() => {
    // Initial session fetch
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, userObj?: User) => {
    try {
      let { data, error } = await supabase
        .from('nocode_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Si el perfil no existe y tenemos el objeto usuario, crearlo (para usuarios antiguos)
      if (error && error.code === 'PGRST116' && userObj) {
        const username = userObj.email ? userObj.email.split('@')[0] : 'dev';
        const newProfile = {
          id: userId,
          email: userObj.email,
          username: username,
          role: 'dev'
        };
        const { data: insertedData, error: insertError } = await supabase
          .from('nocode_profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (!insertError && insertedData) {
          data = insertedData;
          error = null;
        }
      }

      console.log('fetchProfile: userId =', userId, 'data =', data, 'error =', error);

      if (error) {
        console.error('fetchProfile error details:', error.message, error.details, error.hint, error.code);
      }

      if (!error && data) {
        console.log('fetchProfile success: setting profile to', data);
        setProfile(data as Profile);
      } else if (error) {
        // Clear profile if there was an error fetching it
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  return (
    <>
      {loading ? (
        <div className="session-loading">
          <div className="session-loading-aurora aurora-1" />
          <div className="session-loading-aurora aurora-2" />

          <div className="session-loading-content">
            <div className="session-loading-badge">
              <span className="session-loading-spinner" />
            </div>
            <p className="session-loading-title">NoCode<span className="text-gradient">QA</span></p>
            <p className="session-loading-subtitle">Cargando sesión...</p>
          </div>

          <style jsx>{`
            .session-loading {
              position: relative;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--bg-app);
              overflow: hidden;
            }

            .session-loading-aurora {
              position: absolute;
              width: 560px;
              height: 560px;
              border-radius: 50%;
              filter: blur(90px);
              opacity: 0.45;
            }

            .aurora-1 {
              top: -12%;
              left: -8%;
              background: radial-gradient(circle, hsla(263, 85%, 64%, 0.55), transparent 70%);
            }

            .aurora-2 {
              bottom: -16%;
              right: -10%;
              background: radial-gradient(circle, hsla(190, 90%, 50%, 0.5), transparent 70%);
            }

            .session-loading-content {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }

            .session-loading-badge {
              width: 56px;
              height: 56px;
              border-radius: var(--radius-md);
              background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 18px;
              box-shadow: 0 0 32px hsla(263, 85%, 64%, 0.4);
            }

            .session-loading-spinner {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 2.5px solid rgba(255, 255, 255, 0.35);
              border-top-color: white;
              animation: session-spin 0.8s linear infinite;
            }

            .session-loading-title {
              font-family: var(--font-display);
              font-size: 1.4rem;
              font-weight: 700;
              letter-spacing: -0.01em;
              color: var(--text-primary);
              margin: 0;
            }

            .text-gradient {
              background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }

            .session-loading-subtitle {
              font-size: 0.85rem;
              color: var(--text-muted);
              margin: 6px 0 0;
            }

            @keyframes session-spin {
              to { transform: rotate(360deg); }
            }

            @media (prefers-reduced-motion: reduce) {
              .session-loading-spinner {
                animation: none;
              }
            }
          `}</style>
        </div>
      ) : !user ? (
        // Not logged in: show Login UI instead of children
        <Login />
      ) : (
        // Logged in
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
          {children}
        </AuthContext.Provider>
      )}

      {transitionType && (
        <AuthTransition type={transitionType} onDone={() => setTransitionType(null)} />
      )}
    </>
  );
}
