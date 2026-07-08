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

    // Set initial loading based on session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('bt_token', session.access_token);
        // Get user profile from backend (backend will auto-provision or load user by email)
        api.get('/auth/me')
          .then(data => setUser(data.user))
          .catch(() => {
            supabase.auth.signOut();
            localStorage.removeItem('bt_token');
          })
          .finally(() => setLoading(false));
      } else {
        // Fallback check if they had a local token but no Supabase session (e.g. admin)
        const token = localStorage.getItem('bt_token');
        if (token) {
          api.get('/auth/me')
            .then(data => setUser(data.user))
            .catch(() => localStorage.removeItem('bt_token'))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }
    });

    // Listen for auth state changes
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
      } else {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('bt_token');
          setUser(null);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('bt_token', data.session.access_token);
      const profile = await api.get('/auth/me');
      setUser(profile.user);
      return profile;
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

  const loginWithToken = (token, userData) => {
    localStorage.setItem('bt_token', token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, loginWithToken }}>
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
