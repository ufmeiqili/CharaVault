import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5001/logout", {
        method: "POST",
        credentials: "include"
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  return (
    <header className="header">
      <button 
        className="header-btn create-btn" 
        onClick={() => navigate("/create")}
      >
        Create New
      </button>
      
      <img 
        src="/assets/brand/logo12.png" 
        alt="CharaVault" 
        className="header-logo"
        onClick={() => navigate("/main")}
      />
      
      <div className="header-right">
        <button 
          className="header-btn profile-btn" 
          onClick={() => navigate("/profile")}
        >
          <i className="fa-solid fa-user"></i>
        </button>
        <button 
          className="header-btn logout-btn" 
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Header;