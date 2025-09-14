import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; 

function Home() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="motion-logo-placeholder">
          <span>Motion graphics logo</span>
      </div>
      <button onClick={() => navigate("/login")}>Log In</button>
      <button onClick={() => navigate("/register")}>Sign Up</button>
    </div>
  );
}

export default Home;