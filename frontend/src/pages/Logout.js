import React, { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Container, Card, CardContent, Typography } from "@mui/material";

export default function Logout(){
  const { logout } = useAuth();
  useEffect(()=>{ logout().then(()=>window.location.href="/"); },[logout]);
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card><CardContent><Typography>Logging out…</Typography></CardContent></Card>
    </Container>
  );
}
