import React, { useState } from "react";
import "./AuthForm.css";

function AuthForm({ title, buttonText, onSubmit, logoSrc }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ username, password, setError });
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  return (
    <div className="container">
      <img src={logoSrc} alt="logo12" className="logo12"/>
      <h2 className="auth-title">{title}</h2>
      <form onSubmit={handleSubmit}>
        <label className="auth-label">
          <b>Username</b>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="auth-label">
          <b>Password</b>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div style={{color: "red"}}>{error}</div>}
        <button className="auth-button" type="submit">{buttonText}</button>
      </form>
    </div>
  );
}

export default AuthForm;