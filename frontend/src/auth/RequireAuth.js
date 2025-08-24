import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ roles }) {
  const auth = useAuth() || {};
  const { user, authReady } = auth;
  const location = useLocation();

  // ✅ Wait until AuthProvider finishes its first /me check
  if (!authReady) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  // Not logged in → go to login (preserve from)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check (if provided)
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
