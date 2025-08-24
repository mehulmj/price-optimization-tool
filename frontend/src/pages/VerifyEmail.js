// src/pages/VerifyEmail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, CardContent, Typography, CircularProgress, Alert } from "@mui/material";
import api from "../api";

export default function VerifyEmail() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.get(`/auth/verify-email/${uidb64}/${token}/`);
        setStatus("success");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        console.error("Verification failed:", error);
        setStatus("error");
      }
    };

    if (uidb64 && token) {
      verifyEmail();
    }
  }, [uidb64, token, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          {status === "verifying" && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6">Verifying your email...</Typography>
              <Typography color="text.secondary">Please wait a moment.</Typography>
            </>
          )}
          
          {status === "success" && (
            <>
              <Typography variant="h5" color="success.main" sx={{ mb: 1 }}>
                ✅ Email Verified!
              </Typography>
              <Typography color="text.secondary">
                Your email has been verified successfully. Redirecting to login...
              </Typography>
            </>
          )}
          
          {status === "error" && (
            <>
              <Typography variant="h5" color="error.main" sx={{ mb: 2 }}>
                ❌ Verification Failed
              </Typography>
              <Alert severity="error">
                The verification link is invalid or has expired. Please try signing up again or contact support.
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}