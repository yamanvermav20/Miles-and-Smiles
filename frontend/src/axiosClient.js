// src/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_SERVER,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

// Add auth token to requests if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add interceptors to log requests/errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ Axios error:", error);
    return Promise.reject(error);
  }
);

export default axiosClient;
