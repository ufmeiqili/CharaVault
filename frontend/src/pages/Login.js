import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthForm from "../components/AuthForm";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async ({ username, password, setError }) => {
    try {
      const res = await axios.post("http://localhost:5001/login", { username, password }, { withCredentials: true });
      // Remove the alert and redirect to main page
      navigate("/main");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <AuthForm
      title="Log In"
      buttonText="Log In"
      onSubmit={handleLogin}
      logoSrc="/assets/brand/logo12.png"
    />
  );
}

export default Login;