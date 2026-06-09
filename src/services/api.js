import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export default api;

export async function getMarketData() {
  const response = await api.get("/market");
  return response.data;
}

export async function optimizePortfolio(payload) {
  const response = await api.post(
    "/portfolio/optimize",
    payload
  );

  return response.data;
}