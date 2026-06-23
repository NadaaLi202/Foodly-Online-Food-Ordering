import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const missingProvider = () => {
  throw new Error('useAuth must be used within an AuthProvider');
};

const defaultAuthContext = {
  user: null,
  loading: false,
  isAuthenticated: false,
  isAdmin: false,
  login: missingProvider,
  register: missingProvider,
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContext);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('foodly_user'));
  } catch {
    return null;
  }
};

const normalizeUser = (authUser) => {
  if (!authUser) {
    return null;
  }

  return {
    ...authUser,
    role: typeof authUser.role === 'string' ? authUser.role.trim().toLowerCase() : authUser.role,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => normalizeUser(getStoredUser()));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('foodly_token')));

  const setSession = (session) => {
    const sessionUser = normalizeUser(session.user);

    localStorage.setItem('foodly_token', session.token);
    localStorage.setItem('foodly_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('foodly_token');

    if (!token) {
      setLoading(false);
      return;
    }

    const profileToken = token;

    authService.profile()
      .then(({ data }) => {
        if (localStorage.getItem('foodly_token') !== profileToken) {
          return;
        }

        const profileUser = normalizeUser(data.user);

        localStorage.setItem('foodly_user', JSON.stringify(profileUser));
        setUser(profileUser);
      })
      .catch(() => {
        if (localStorage.getItem('foodly_token') !== profileToken) {
          return;
        }

        localStorage.removeItem('foodly_token');
        localStorage.removeItem('foodly_user');
        setUser(null);
      })
      .finally(() => {
        if (localStorage.getItem('foodly_token') === profileToken) {
          setLoading(false);
        }
      });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login: async (payload) => {
      const { data } = await authService.login(payload);
      setSession(data);
      return normalizeUser(data.user);
    },
    register: async (payload) => {
      const { data } = await authService.register(payload);
      setSession(data);
      return normalizeUser(data.user);
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
