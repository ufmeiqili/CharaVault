import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./ProfilePage.css";

function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userCharacters, setUserCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      const userResponse = await fetch("http://localhost:5001/me", {
        credentials: "include"
      });
      
      if (!userResponse.ok) {
        navigate("/login");
        return;
      }
      
      const userData = await userResponse.json();
      setCurrentUser(userData);
      
      // Try to fetch user's characters - don't fail if this doesn't work
      try {
        const charactersResponse = await fetch(`http://localhost:5001/user/${userData.user_id}/characters`, {
          credentials: "include"
        });
        
        if (charactersResponse.ok) {
          const charactersData = await charactersResponse.json();
          setUserCharacters(charactersData);
        } else {
          // If characters fetch fails, just set empty array (user has no characters)
          setUserCharacters([]);
        }
      } catch (characterError) {
        console.log("Could not fetch characters, user may have none:", characterError);
        setUserCharacters([]);
      }
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Only set error if we can't get user info, not if we can't get characters
      setError("Failed to load user information");
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterClick = (characterId) => {
    navigate(`/character/${characterId}`);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Header />
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-content">
        <div className="profile-container">
          <div className="profile-header">
            <h1 className="profile-title">Profile</h1>
            <h2 className="username">{currentUser?.username}</h2>
          </div>

          <div className="character-section">
            <h3 className="section-title">Character Cards</h3>
            
            {userCharacters.length > 0 ? (
              <div className="character-grid">
                {userCharacters.map((character) => (
                  <div 
                    key={character.id} 
                    className="character-card"
                    onClick={() => handleCharacterClick(character.id)}
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
                    <div className="character-name">{character.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-characters">
                <p>You haven't created any characters yet.</p>
                <button 
                  className="create-character-btn"
                  onClick={() => navigate("/create")}
                >
                  Create Your First Character
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;