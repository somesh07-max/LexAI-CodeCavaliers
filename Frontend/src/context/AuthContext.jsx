import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, restoreAccessToken, setAccessToken, setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'lexai-user';

function storedUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(storedUser);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setSessionExpiredHandler(logout);
    restoreAccessToken().catch(() => {
      setAccessToken(null);
      setUser(null);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
    }).finally(() => setReady(true));
  }, [logout]);

  const authenticate = useCallback((token, nextUser, { remember = false } = {}) => {
    setAccessToken(token);
    setUser(nextUser);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const value = useMemo(() => ({ user, ready, authenticate, logout, api }), [user, ready, authenticate, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
