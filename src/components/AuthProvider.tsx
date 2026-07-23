'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import Login from './Login';

type Profile = {
  id: string;
  role: 'QA' | 'dev' | 'leader' | 'admin' | 'Administrator' | string;
  username: string;
  full_name?: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  // If loading session, show blank or simple spinner
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        Cargando sesión...
      </div>
    );
  }

  // If not logged in, show Login UI instead of children
  if (!user) {
    return <Login />;
  }

  // Logged in
  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
