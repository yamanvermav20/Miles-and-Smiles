import axiosClient from "../axiosClient.js";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login({ onMessage }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const { applyAuth } = useAuth();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      onMessage && onMessage({ text: "Logging in...", type: "info" });
      const response = await axiosClient.post(`/api/auth/login`, formData);
      const { accessToken, user } = response.data;
      applyAuth(accessToken, user);

      onMessage &&
        onMessage({
          text: "Login successful! Redirecting...",
          type: "success",
        });
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      onMessage &&
        onMessage({
          text: error.response?.data?.message || "Login failed",
          type: "error",
        });
    }

    console.log("Login Data:", formData);
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      <div className="group animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <label className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-accent transition-colors">
          Username
        </label>
        <input
          type="text"
          name="username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          className="input focus:scale-[1.02] transition-transform"
        />
      </div>
      <div className="group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        <label className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-accent transition-colors">
          Password
        </label>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          className="input focus:scale-[1.02] transition-transform"
        />
      </div>
      <button
        type="submit"
        className="btn-primary w-full mt-3 animate-fadeIn hover:scale-[1.02] active:scale-[0.98] transition-transform"
        style={{ animationDelay: '0.3s' }}
      >
        Sign In
      </button>
    </form>
  );
}
