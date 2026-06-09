import axios from "axios";

const api = axios.create({
  baseURL: "https://quant-lab-0e1q.onrender.com/api",
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