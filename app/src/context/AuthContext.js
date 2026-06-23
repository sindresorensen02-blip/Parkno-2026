import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password, fullName, role = 'sjåfør') =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const updateProfile = async (changes) => {
    if (!user) return { error: new Error('Not logged in') };
    const { error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', user.id);
    if (!error) setProfile(prev => ({ ...prev, ...changes }));
    return { error };
  };

  const signOut = () => {
    setDevBypass(false);
    setProfile(null);
    return supabase.auth.signOut();
  };

  const skipLogin = () => { if (__DEV__) setDevBypass(true); };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, devBypass, skipLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
