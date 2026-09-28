import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n, { LANGUAGE_CODES } from "@/i18n";
import { accountApi, authApi, tokenStorage, UNAUTHORIZED_EVENT } from "@/lib/api";

const SessionContext = createContext(null);

// A signed-in user's saved language wins over the browser's.
function applyUserLanguage(user) {
  const lang = user?.preferredLanguage;
  if (lang && LANGUAGE_CODES.includes(lang) && lang !== i18n.resolvedLanguage) {
    i18n.changeLanguage(lang);
  }
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let active = true;
    authApi
      .me()
      .then(({ user }) => {
        if (!active) return;
        setUser(user);
        applyUserLanguage(user);
      })
      .catch((error) => {
        // Only discard the token when the server rejected it, not on network errors.
        if (error.response?.status === 401) tokenStorage.clear();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const startSession = useCallback(({ user, token }) => {
    tokenStorage.set(token);
    setUser(user);
    applyUserLanguage(user);
    return user;
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await authApi.login(email, password)),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession(await authApi.register(details)),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) await authApi.logout();
    } catch {
      // Signing out locally is what matters.
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const updated = await accountApi.update(changes);
    setUser(updated);
    return updated;
  }, []);

  const acceptConsents = useCallback(async (consents) => {
    const updated = await accountApi.acceptConsents(consents);
    setUser(updated);
    return updated;
  }, []);

  // After the account is deleted server-side.
  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      acceptConsents,
      clearSession,
    }),
    [user, loading, login, register, logout, updateProfile, acceptConsents, clearSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}
