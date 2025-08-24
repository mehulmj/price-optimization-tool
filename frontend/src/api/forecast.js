// frontend/src/api/forecast.js
import api from "../api";

// Generate demand forecasts for products
export async function generateForecasts(data) {
  const response = await api.post("/forecast/generate/", data);
  return response.data;
}

// Get forecast overview/summary
export async function getForecastOverview() {
  const response = await api.get("/forecast/overview/");
  return response.data;
}

// Get chart data for visualization
export async function getForecastChartData(productIds = []) {
  const params = productIds.length > 0 ? { product_ids: productIds.join(',') } : {};
  const response = await api.get("/forecast/chart-data/", { params });
  return response.data;
}

// Get all forecasts (with pagination)
export async function listForecasts(params = {}) {
  const response = await api.get("/forecast/", { params });
  return response.data;
}

// Get specific forecast
export async function getForecast(id) {
  const response = await api.get(`/forecast/${id}/`);
  return response.data;
}

// Delete forecast
export async function deleteForecast(id) {
  const response = await api.delete(`/forecast/${id}/`);
  return response.data;
}