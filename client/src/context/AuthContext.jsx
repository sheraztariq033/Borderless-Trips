import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Fallback if supabase is not initialized
      const token = localStorage.getItem('bt_token');
      if (token) {
        api.get('/auth/me')
          .then(data => setUser(data.user))
          .catch(() => localStorage.removeItem('bt_token'))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    // Detect if we're returning from an OAuth redirect (URL has code or access_token)
    const url = new URL(window.location.href);
    const hasOAuthCallback = url.searchParams.has('code') || url.hash.includes('access_token');

    // Listen for auth state changes FIRST so we don't miss the OAuth callback event
    let oauthResolved = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('bt_token', session.access_token);
        try {
          const data = await api.get('/auth/me');
          setUser(data.user);
        } catch (e) {
          supabase.auth.signOut();
          localStorage.removeItem('bt_token');
          setUser(null);
        }
        oauthResolved = true;
        setLoading(false);
      } else {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('bt_token');
          setUser(null);
        }
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('bt_token', session.access_token);
        api.get('/auth/me')
          .then(data => setUser(data.user))
          .catch(() => {
            supabase.auth.signOut();
            localStorage.removeItem('bt_token');
          })
          .finally(() => setLoading(false));
      } else if (!hasOAuthCallback) {
        // Only set loading=false immediately if we're NOT in an OAuth callback
        const token = localStorage.getItem('bt_token');
        if (token) {
          api.get('/auth/me')
            .then(data => setUser(data.user))
            .catch(() => localStorage.removeItem('bt_token'))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        // We're in an OAuth callback — give onAuthStateChange up to 5s to resolve
        setTimeout(() => {
          if (!oauthResolved) setLoading(false);
        }, 5000);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('bt_token', data.session.access_token);
        const profile = await api.get('/auth/me');
        setUser(profile.user);
        return profile;
      } catch (supabaseErr) {
        // Fallback to direct backend login (for admin/staff accounts not in Supabase Auth)
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('bt_token', data.token);
        setUser(data.user);
        return data;
      }
    } else {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('bt_token', data.token);
      setUser(data.user);
      return data;
    }
  };

  const register = async (userData) => {
    if (supabase) {
      const { name, email, password, phone, nationality } = userData;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || '',
            nationality: nationality || ''
          }
        }
      });
      if (error) throw error;
      
      if (data.session) {
        localStorage.setItem('bt_token', data.session.access_token);
        const profile = await api.get('/auth/me');
        setUser(profile.user);
        return profile;
      }
      return data;
    } else {
      const data = await api.post('/auth/register', userData);
      localStorage.setItem('bt_token', data.token);
      setUser(data.user);
      return data;
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('bt_token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const data = await api.put('/auth/profile', profileData);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase is not initialized');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  };

  const loginWithToken = (token, userData) => {
    localStorage.setItem('bt_token', token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, loginWithToken, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
