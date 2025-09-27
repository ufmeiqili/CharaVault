import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; 

function Home() {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('ended', () => {
        setShowVideo(false);
      });
      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setVideoError(true);
        setShowVideo(false);
      });
      video.addEventListener('loadeddata', () => {
        console.log('Video loaded successfully');
      });
    }
  }, []);

  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  const handleVideoError = () => {
    console.error('Video failed to load');
    setVideoError(true);
    setShowVideo(false);
  };

  return (
    <>
      {showVideo && (
        <div className="video-overlay">
          <video
            ref={videoRef}
            className="intro-video"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
          >
            <source src="/assets/brand/logoAnimation.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          {videoError && (
            <div className="video-error">
              <p>Video failed to load. Check console for details.</p>
              <button onClick={() => setShowVideo(false)}>Skip to Home</button>
            </div>
          )}
        </div>
      )}
      
      <div className={`main-content ${showVideo ? 'blurred' : ''}`}>
        <div className="container">
          <div className="logo-container">
              <img src="/assets/brand/logo12.png" alt="CharaVault Logo" className="home-logo" />
          </div>
          <button onClick={() => navigate("/login")}>Log In</button>
          <button onClick={() => navigate("/register")}>Sign Up</button>
        </div>
      </div>
    </>
  );
}

export default Home;