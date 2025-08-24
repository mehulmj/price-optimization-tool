import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api";
import { Container, Card, CardContent, Typography, Stack, TextField, Button, Alert } from "@mui/material";

export default function Login(){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState(null);
  const [loading,setLoading]=useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  const submit=async(e)=>{
    e.preventDefault(); setErr(null); setLoading(true);
    try{
      await login(username,password);
      nav("/");
    }catch(e){
      setErr(e?.response?.data?.detail || "Login failed");
    }finally{ setLoading(false); }
  };

  const resend = async ()=>{
    if(!username.includes("@")) return alert("Enter your email in the Username/Email field");
    await api.post("/auth/resend-verification/", { email: username });
    alert("If the account exists and is unverified, a link has been sent.");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: .5 }}>Welcome back</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Log in to continue</Typography>

          {err && (
            <Alert severity="error" sx={{ mb: 2 }}
              action={
                String(err).toLowerCase().includes("verify") ? (
                  <Button color="inherit" size="small" onClick={resend}>Resend verification</Button>
                ) : null
              }
            >
              {String(err)}
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="Username or Email" value={username} onChange={e=>setUsername(e.target.value)} required fullWidth/>
            <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required fullWidth/>
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button type="submit" variant="contained" disabled={loading}>{loading ? "Signing in…" : "Login"}</Button>
              <Button href="/signup" color="inherit">Create account</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
