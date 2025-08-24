import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Container } from "@mui/material";

export default function Layout() {
  return (
    <>
      <Navbar />
      {/* Keep a wrapper so every page doesn't full-bleed */}
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Outlet />
      </Container>
    </>
  );
}
