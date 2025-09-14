import React from "react";
import axios from "axios";
import AuthForm from "../components/AuthForm";

function Register() {
  const handleRegister = async ({ username, password, setError }) => {
    try {
      const res = await axios.post("http://localhost:5001/register", { username, password }, { withCredentials: true });
      alert(res.data.message);
      // Redirect or show success here
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <AuthForm
      title="Sign Up"
      buttonText="Sign Up"
      onSubmit={handleRegister}
      logoSrc="/assets/logo12.png"
    />
  );
}

export default Register;