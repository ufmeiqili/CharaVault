import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./CharacterCreator.css";

function CharacterCreator() {
  const [formData, setFormData] = useState({
    name: "",
    tags: "",
    description: "",
    headshot: null,
    turnaround: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:5001/me", {
          credentials: "include"
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHeadshotChange = (e) => {
    const file = e.target.files[0];
    if (file && isValidImageFile(file)) {
      setFormData(prev => ({
        ...prev,
        headshot: file
      }));
    } else {
      setError("Please select a valid image file (PNG, JPG, JPEG, GIF, WEBP)");
    }
  };

  const handleTurnaroundChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 8) {
      setError("Maximum 8 turnaround images allowed");
      return;
    }
    
    const validFiles = files.filter(file => isValidImageFile(file));
    if (validFiles.length !== files.length) {
      setError("Please select only valid image files (PNG, JPG, JPEG, GIF, WEBP)");
      return;
    }

    setFormData(prev => ({
      ...prev,
      turnaround: validFiles
    }));
  };

  const isValidImageFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Character name is required");
      return false;
    }
    if (formData.name.length > 20) {
      setError("Character name must be 20 characters or less");
      return false;
    }
    if (formData.description.length > 1000) {
      setError("Description must be 1000 characters or less");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.headshot) {
      setError("Headshot image is required");
      return false;
    }

    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length > 5) {
      setError("Maximum 5 tags allowed");
      return false;
    }
    for (let tag of tags) {
      if (tag.length > 20) {
        setError("Each tag must be 20 characters or less");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('artist_id', currentUser.user_id);
    submitData.append('tags', formData.tags);
    submitData.append('description', formData.description);
    submitData.append('headshot', formData.headshot);
    
    formData.turnaround.forEach((file) => {
      submitData.append('turnaround', file);
    });

    try {
      const response = await fetch("http://localhost:5001/create_character", {
        method: "POST",
        body: submitData,
        credentials: "include"
      });

      if (response.ok) {
        const result = await response.json();
        navigate(`/character/${result.character_id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create character");
      }
    } catch (error) {
      console.error("Character creation failed:", error);
      setError("Failed to create character. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="character-creator">
      <Header />
      
      <div className="creator-content">
        <div className="creator-form-container">
          <h1 className="creator-title">Character Creator</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="creator-form">
            <div className="form-group">
              <label className="form-label">Character Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter the character name"
                maxLength="20"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter the Tags (up to 5; no spaces)"
                className="form-input"
              />
              <small className="form-hint">Separate tags with commas. Max 5 tags, 20 characters each.</small>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter the character description"
                maxLength="1000"
                className="form-textarea"
                rows="5"
                required
              />
              <small className="form-hint">{formData.description.length}/1000 characters</small>
            </div>

            <div className="image-uploads">
              <div className="upload-group">
                <label className="form-label">Headshot Image</label>
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                    onChange={handleHeadshotChange}
                    className="file-input"
                    id="headshot"
                    required
                  />
                  <label htmlFor="headshot" className="upload-label">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      {formData.headshot ? formData.headshot.name : "Upload your image"}
                    </div>
                  </label>
                </div>
              </div>

              <div className="upload-group">
                <label className="form-label">Supporting Images</label>
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                    onChange={handleTurnaroundChange}
                    className="file-input"
                    id="turnaround"
                    multiple
                  />
                  <label htmlFor="turnaround" className="upload-label">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      {formData.turnaround.length > 0 
                        ? `${formData.turnaround.length} image(s) selected` 
                        : "Upload your image"}
                    </div>
                  </label>
                </div>
                <small className="form-hint">Up to 8 images allowed</small>
              </div>
            </div>

            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CharacterCreator;