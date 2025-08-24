// src/components/Navbar.js
import React from "react";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Link,
  Stack,
  Chip,
  Button,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role ?? "guest";

  return (
    <AppBar
      elevation={0}
      position="sticky"
      color="transparent"
      sx={{
        backdropFilter: "saturate(120%) blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.10))",
      }}
    >
      {/* No Container => full-width. Toolbar gets small horizontal padding */}
      <Toolbar disableGutters sx={{ minHeight: 72, px: 2 }}>
        {/* Left spacer to mirror the old layout (optional) */}
        <Box sx={{ width: 120 }} />

        {/* Center brand */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
              BCG
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "primary.main" }}>
              X
            </Typography>
          </Link>
        </Box>

        {/* Right actions — flush right */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            ml: "auto",
            mr: 0,
            "& .MuiButton-root": { textTransform: "none" },
            "& .MuiLink-root": { textDecoration: "none" },
          }}
        >
          {user ? (
            <>
              <Chip
                size="small"
                label={`${user.username} · ${role}`}
                sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
              />

              {/* Only buyers see Become Supplier */}
              {role === "buyer" && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate("/supplier-request")}
                >
                  Become Supplier
                </Button>
              )}

              <Button
                color="inherit"
                onClick={() => logout().then(() => navigate("/", { replace: true }))}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link component={NavLink} to="/login" color="inherit">
                Login
              </Link>
              <Button
                variant="contained"
                size="small"
                component={NavLink}
                to="/signup"
                sx={{ px: 1.5, py: 0.75, fontWeight: 700, minWidth: 0 }}
              >
                Sign up
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
