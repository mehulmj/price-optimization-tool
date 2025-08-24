// src/pages/Home.js
import React from "react";
import {
  Box, Container, Grid, Typography, Card, CardContent, Button, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

// Tile component — mobile pe padding chhota, icon chhota
function Tile({ to, icon, title, body }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // <600px

  return (
    <Card
      elevation={2}
      sx={{
        bgcolor: "#fff",
        color: "#111",
        borderRadius: { xs: 2, md: 2.5 },
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, md: 3 },              // mobile padding kam
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box sx={{ fontSize: isXs ? 36 : 48, color: "#111", mb: 1.5 }}>
          {icon}
        </Box>

        <Typography
          variant={isXs ? "subtitle1" : "h6"}  // mobile heading thoda chhota
          sx={{ fontWeight: 800, mb: 1 }}
        >
          {title}
        </Typography>

        <Typography sx={{ color: "#555", mb: 2.5, flexGrow: 1 }}>
          {body}
        </Typography>

        <Button
          variant="text"
          size={isXs ? "medium" : "large"}
          endIcon={<ArrowForwardRoundedIcon />}
          component={RouterLink}
          to={to}
          sx={{ px: 0, alignSelf: "flex-start", fontWeight: 700 }}
        >
          Go
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ py: { xs: 4, md: 8 } }}>
      {/* HERO */}
      <Container maxWidth="lg">
        <Box textAlign="center" sx={{ mb: { xs: 4, md: 6 }, maxWidth: 900, mx: "auto" }}>
          <Typography
            variant={isXs ? "h4" : "h3"}     // mobile hero chhota
            sx={{ fontWeight: 800, mb: 1.5 }}
          >
            Price Optimization Tool
          </Typography>
          <Typography
            sx={{
              maxWidth: 720,
              mx: "auto",
              color: "rgba(255,255,255,.85)",
              px: { xs: 2, md: 0 },          // mobile pe thoda side padding
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Typography>
        </Box>
      </Container>

      {/* TILES — center aligned, mobile 1‑column, tablet/laptop 2‑column */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          justifyContent="center"      // center align row
          alignItems="stretch"
        >
          {/* Card 1 */}
          <Grid item xs={12} md={6}>
            {/* ye Box ensure karta hai: mobile 100%, bade screens pe maxWidth ~540-560 */}
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 560 }, mx: "auto" }}>
              <Tile
                to="/products"
                icon={<LanRoundedIcon fontSize="inherit" />}
                title="Create and Manage Product"
                body="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
              />
            </Box>
          </Grid>

          {/* Card 2 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 560 }, mx: "auto" }}>
              <Tile
                to="/pricing"
                icon={<QueryStatsRoundedIcon fontSize="inherit" />}
                title="Pricing Optimization"
                body="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
