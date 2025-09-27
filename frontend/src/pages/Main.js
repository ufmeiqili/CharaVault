import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./MainPage.css";

function MainPage() {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication first
    checkAuthAndFetchCharacters();
  }, []);

  const checkAuthAndFetchCharacters = async () => {
    try {
      const userResponse = await fetch("http://localhost:5001/me", {
        credentials: "include"
      });
      
      if (!userResponse.ok) {
        navigate("/login");
        return;
      }
      
      // User is authenticated, fetch characters
      fetchCharacters();
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/login");
    }
  };

  const fetchCharacters = async (search = "", type = "name") => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
        params.append('type', type);
      }
      
      const response = await fetch(`http://localhost:5001/characters?${params}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCharacters(searchTerm, searchType);
  };

  const handleCardClick = (characterId) => {
    navigate(`/character/${characterId}`);
  };

  if (loading) {
    return (
      <div className="main-page">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="main-page">
      <Header />
      
      <div className="main-content">
        <div className="search-section">
          <div className="search-toggles">
            <button 
              className={`toggle-btn ${searchType === 'name' ? 'active' : ''}`}
              onClick={() => setSearchType('name')}
            >
              Name
            </button>
            <button 
              className={`toggle-btn ${searchType === 'tags' ? 'active' : ''}`}
              onClick={() => setSearchType('tags')}
            >
              #Tags
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder={`Search by ${searchType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </form>
        </div>

        <div className="characters-grid">
          {characters.map((character) => (
            <div 
              key={character.id} 
              className="character-card"
              onClick={() => handleCardClick(character.id)}
            >
              <div className="character-image">
                <img 
                  src={`http://localhost:5001/uploads/${character.headshot_image}`} 
                  alt={character.name}
                  onError={(e) => {
                    e.target.src = "/assets/placeholder.png";
                  }}
                />
              </div>
              <div className="character-info">
                <h3 className="character-name">{character.name}</h3>
                <p className="character-artist">by {character.artist}</p>
              </div>
            </div>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="no-results">
            <p>No characters found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;