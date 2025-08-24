// src/pages/SupplierRequest.js
import React, { useEffect, useState } from "react";
import { Container, Card, CardContent, Typography, TextField, Button, Stack, Alert, Chip } from "@mui/material";
import api from "../api";
import { useAuth } from "../auth/AuthContext";

const statusColor = (s) => s === "approved" ? "success" : s === "rejected" ? "error" : "warning";

export default function SupplierRequest(){
  const { user } = useAuth();
  const [company,setCompany]=useState("");
  const [reason,setReason]=useState("");
  const [status,setStatus]=useState("");
  const [msg,setMsg]=useState("");

  useEffect(()=>{ (async()=>{
    try{
      const {data}=await api.get("/auth/supplier-request/");
      if(data?.exists){ setStatus(data.request.status); }
    }catch{}
  })(); },[]);

  const submit=async(e)=>{
    e.preventDefault(); setMsg("");
    try{
      const {data}=await api.post("/auth/supplier-request/", {company,reason});
      setStatus(data.status);
      setMsg("Request submitted.");
    }catch(e){ setMsg(e?.response?.data?.detail || "Unable to submit."); }
  };

  if (user?.role !== "buyer"){
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card><CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Supplier Access</Typography>
          <Typography color="text.secondary">
            Your role is <b>{user?.role}</b>. Only buyers can request supplier access.
          </Typography>
        </CardContent></Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Request Supplier Access</Typography>
            {status && <Chip label={status} color={statusColor(status)} />}
          </Stack>
          {msg && <Alert severity="info" sx={{ mb: 2 }}>{msg}</Alert>}

          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="Company" value={company} onChange={e=>setCompany(e.target.value)} fullWidth/>
            <TextField label="Reason" value={reason} onChange={e=>setReason(e.target.value)} fullWidth multiline minRows={4}/>
            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained">Submit</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
