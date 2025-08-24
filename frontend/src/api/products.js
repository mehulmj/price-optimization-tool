// src/api/products.js

const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api";

// Get JWT token from localStorage (same as api.js)
function getAuthHeaders() {
  const token = localStorage.getItem("access");
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

const toQS = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

// ------------ READ ------------
export async function listProducts(params = {}) {
  const qs = toQS(params);
  const url = `${BASE}/products/${qs ? "?" + qs : ""}`;
  
  console.log("Fetching from URL:", url);
  console.log("Auth headers:", getAuthHeaders());
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      // Don't use credentials with JWT
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      if (res.status === 401) {
        // Token might be expired, redirect to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return;
      }
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("API Response data:", data);
    
    return {
      data: Array.isArray(data) ? { results: data, count: data.length } : data,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export async function getProduct(id) {
  const url = `${BASE}/products/${id}/`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return;
    }
    throw new Error("Failed to load product");
  }
  return { data: await res.json() };
}

export async function createProduct(payload) {
  const res = await fetch(`${BASE}/products/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return;
    }
    throw new Error("Create failed");
  }
  return { data: await res.json() };
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${BASE}/products/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return;
    }
    throw new Error("Update failed");
  }
  return { data: await res.json() };
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/products/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    if (res.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return;
    }
    throw new Error("Delete failed");
  }
  return true;
}