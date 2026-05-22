import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axiosClient from "../axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // keep token in localStorage for cross-tab auth events and axios interceptor
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  // user will be fetched from backend /api/user/me to reduce localStorage dependence
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyAuth = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem("token", nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }

    // store user in memory only (do not persist to localStorage).
    // callers can pass the user returned from login/signup to prefill UI.
    if (nextUser) setUser(nextUser);
    else setUser(null);
  }, []);

  const login = async (credentials, requestFn) => {
    setLoading(true);
    try {
      const { token: t, user: u } = await requestFn(credentials);
      applyAuth(t, u);
      return { token: t, user: u };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    applyAuth(null, null);

    localStorage.setItem("showFavoritesOnly", "false");
    window.dispatchEvent(
      new CustomEvent("favoritesFilterChange", { detail: false })
    );
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      const updated = { ...prev, ...partial };
      // notify listeners about user update (components can subscribe to context)
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: updated }));
      return updated;
    });
  };

  // Cross-tab sync
  // Cross-tab sync for token changes. When token changes, fetch /api/user/me
  useEffect(() => {
    const handleStorage = async (e) => {
      if (e.key === "token") {
        const newToken = localStorage.getItem("token");
        setToken(newToken);
        if (newToken) {
          try {
            const res = await axiosClient.get("/api/user/me");
            setUser(res.data);
          } catch (err) {
            console.error("Failed to fetch user on token change:", err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // On mount, if token exists, fetch current user from backend
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const t = localStorage.getItem("token");
      if (!t) return;
      try {
        const res = await axiosClient.get("/api/user/me");
        if (!mounted) return;
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setUser(null);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
    applyAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
