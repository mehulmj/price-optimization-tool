// src/App.js - Fixed: No BrowserRouter here since it's in index.js
import React from "react";
import { Routes, Route } from "react-router-dom"; // ✅ No BrowserRouter import

// Import your components
import RequireAuth from "./auth/RequireAuth";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Logout from "./pages/Logout";
import Products from "./pages/Products"; // The updated Products page without tabs
import PricingOptimization from "./pages/PricingOptimization"; // New separate page
import SupplierRequest from "./pages/SupplierRequest";
import AdminSupplierRequests from "./pages/AdminSupplierRequests";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/verify-email/:uidb64/:token" element={<VerifyEmail />} />
       <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      </Route>
      {/* Protected routes with layout */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          
          {/* Separate pages accessible from home */}
          <Route path="/products" element={<Products />} />
          <Route path="/pricing" element={<PricingOptimization />} />
          
          <Route path="/supplier-request" element={<SupplierRequest />} />

          {/* Admin only routes */}
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="/admin/supplier-requests" element={<AdminSupplierRequests />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;   