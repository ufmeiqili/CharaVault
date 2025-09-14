import React from "react";
import axios from "axios";
import AuthForm from "../components/AuthForm";

function Login() {
  const handleLogin = async ({ username, password, setError }) => {
    try {
      const res = await axios.post("http://localhost:5001/login", { username, password }, { withCredentials: true });
      alert(res.data.message);
      // Redirect or set auth state here
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <AuthForm
      title="Log In"
      buttonText="Log In"
      onSubmit={handleLogin}
      logoSrc="/assets/logo12.png"
    />
  );
}

export default Login;