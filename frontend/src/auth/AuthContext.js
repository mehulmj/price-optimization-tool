import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api"; // axios instance with baseURL

const AuthCtx = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // ✅ know when first check finished

  // Attach token (if present) on first load, then fetch /me exactly once
  useEffect(() => {
    const boot = async () => {
      try {
        const access = localStorage.getItem("access");
        if (!access) {
          // no token -> not logged in
          setUser(null);
          setAuthReady(true);
          return;
        }
        api.defaults.headers.Authorization = `Bearer ${access}`;
        const { data } = await api.get("/auth/me/");
        setUser(data);
      } catch {
        // token invalid/expired
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        delete api.defaults.headers.Authorization;
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };
    boot(); // runs once
  }, []);

  // ---- AUTH API ----
  const login = async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    api.defaults.headers.Authorization = `Bearer ${data.access}`;
    const me = await api.get("/auth/me/");
    setUser(me.data);
    return me.data;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem("refresh");
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {}
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    delete api.defaults.headers.Authorization;
    setUser(null);
    return Promise.resolve();
  };

  const value = { user, setUser, authReady, login, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
