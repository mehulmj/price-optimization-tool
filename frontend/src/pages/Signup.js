import React, { useState } from "react";
import api from "../api";
import { Container, Card, CardContent, Typography, Stack, TextField, Button, Alert } from "@mui/material";

export default function Signup(){
  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [msg,setMsg] = useState(null);
  const [err,setErr] = useState(null);
  const [loading,setLoading] = useState(false);

  const submit = async (e)=>{
    e.preventDefault(); setMsg(null); setErr(null); setLoading(true);
    try{
      await api.post("/auth/register/", {username,email,password});
      setMsg("Verification email sent. Please check your inbox.");
      setUsername(""); setEmail(""); setPassword("");
    }catch(e){
      const d = e?.response?.data || {};
      setErr(d.email || d.username || d.password || d.detail || "Signup failed");
    }finally{ setLoading(false); }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Create account</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Sign up to continue</Typography>

          {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
          {err && <Alert severity="error" sx={{ mb: 2 }}>{String(err)}</Alert>}

          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="Username" value={username} onChange={e=>setUsername(e.target.value)} required fullWidth/>
            <TextField label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required fullWidth/>
            <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required fullWidth/>
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button type="submit" variant="contained" disabled={loading}>{loading ? "Creating…" : "Sign up"}</Button>
              <Button href="/login" color="inherit">I already have an account</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
