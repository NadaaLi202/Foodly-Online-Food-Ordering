import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('foodly_user'));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('foodly_token')));

  const setSession = (session) => {
    localStorage.setItem('foodly_token', session.token);
    localStorage.setItem('foodly_user', JSON.stringify(session.user));
    setUser(session.user);
  };

  useEffect(() => {
    const token = localStorage.getItem('foodly_token');

    if (!token) {
      setLoading(false);
      return;
    }

    authService.profile()
      .then(({ data }) => {
        localStorage.setItem('foodly_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('foodly_token');
        localStorage.removeItem('foodly_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login: async (payload) => {
      const { data } = await authService.login(payload);
      setSession(data);
      return data.user;
    },
    register: async (payload) => {
      const { data } = await authService.register(payload);
      setSession(data);
      return data.user;
    },
    logout: () => {
      localStorage.removeItem('foodly_token');
      localStorage.removeItem('foodly_user');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
