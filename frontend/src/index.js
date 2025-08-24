// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider } from "./auth/AuthContext";

// Your existing theme - keeping the same BCGX styling
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0ea5a4" },     // BCGX mint for accent
    secondary: { main: "#1976d2" },
    background: { default: "#1f1f1f", paper: "#0f152b" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter','Segoe UI','Roboto','Arial','sans-serif'].join(','),
    h2: { fontWeight: 800, letterSpacing: '.2px' },
    h5: { fontWeight: 800 },
  }
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);