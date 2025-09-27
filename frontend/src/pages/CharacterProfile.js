import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./CharacterProfile.css";

function CharacterProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState("bio");
  const [modalImage, setModalImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCharacter();
  }, [id]);

  const fetchCharacter = async () => {
    try {
      const response = await fetch(`http://localhost:5001/character/${id}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
      } else {
        setError("Character not found");
      }
    } catch (error) {
      console.error("Failed to fetch character:", error);
      setError("Failed to load character");
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imageSrc) => {
    setModalImage(imageSrc);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  const getAllImages = () => {
    if (!character) return [];
    
    const images = [];
    
    // Add headshot image
    if (character.headshot_image) {
      images.push({
        src: `http://localhost:5001/uploads/${character.headshot_image}`,
        alt: `${character.name} headshot`
      });
    }
    
    // Add turnaround images
    character.turnaround_images.forEach((image, index) => {
      if (image) {
        images.push({
          src: `http://localhost:5001/uploads/${image}`,
          alt: `${character.name} turnaround ${index + 1}`
        });
      }
    });
    
    return images;
  };

  if (loading) {
    return (
      <div className="character-profile">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="character-profile">
        <Header />
        <div className="error">
          <p>{error}</p>
          <button onClick={() => navigate("/main")} className="back-btn">
            Back to Main
          </button>
        </div>
      </div>
    );
  }

  const allImages = getAllImages();

  return (
    <div className="character-profile">
      <Header />
      
      <div className="profile-content">

        <div className="profile-container">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'bio' ? 'active' : ''}`}
              onClick={() => setActiveTab('bio')}
            >
              Bio
            </button>
            <button 
              className={`tab-btn ${activeTab === 'art' ? 'active' : ''}`}
              onClick={() => setActiveTab('art')}
            >
              Art
            </button>
          </div>

          <div className="profile-main">
            {activeTab === 'bio' && (
              <div className="bio-tab">
                <div className="character-header">
                  <div className="character-image-container">
                    <img 
                      src={`http://localhost:5001/uploads/${character.headshot_image}`}
                      alt={character.name}
                      className="character-headshot"
                      onClick={() => openImageModal(`http://localhost:5001/uploads/${character.headshot_image}`)}
                    />
                  </div>
                  
                  <div className="character-info">
                    <h1 className="character-name">{character.name}</h1>
                    
                    {character.tags && character.tags.length > 0 && (
                      <div className="character-tags">
                        {character.tags.map((tag, index) => (
                          <span key={index} className="tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="character-description">
                  <h3>Biography</h3>
                  <div className="description-text">
                    {character.description}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'art' && (
              <div className="art-tab">
                <div className="art-gallery">
                  {allImages.map((image, index) => (
                    <div key={index} className="art-item">
                      <img 
                        src={image.src}
                        alt={image.alt}
                        className="art-image"
                        onClick={() => openImageModal(image.src)}
                      />
                      <div className="art-number">{index + 1}</div>
                    </div>
                  ))}
                </div>
                
                {allImages.length === 0 && (
                  <div className="no-art">
                    <p>No images available</p>
                  </div>
                )}
                
                <div className="pagination">
                  <span>Page 1 of 1</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeImageModal}>
              ×
            </button>
            <img src={modalImage} alt="Full size" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterProfile;