import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthForm from "../components/AuthForm";

function Register() {
  const navigate = useNavigate();

  const handleRegister = async ({ username, password, setError }) => {
    try {
      const res = await axios.post("http://localhost:5001/register", { username, password }, { withCredentials: true });
      // Remove the alert and redirect to main page
      navigate("/main");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <AuthForm
      title="Sign Up"
      buttonText="Sign Up"
      onSubmit={handleRegister}
      logoSrc="/assets/brand/logo12.png"
    />
  );
}

export default Register;