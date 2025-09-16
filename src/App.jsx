import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './App.css';

const API_URL = 'https://art-gallery-api.doyoonsung.workers.dev/';
const FAVORITES_SIZE = 5;

function App() {
  const [images, setImages] = useState([]);
  const [favorites, setFavorites] = useState(Array(FAVORITES_SIZE).fill(null));
  const [selectedImage, setSelectedImage] = useState(null);
  const [swiper, setSwiper] = useState(null);
  const [jumpTo, setJumpTo] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [replacementMode, setReplacementMode] = useState(false);
  const [imageToReplace, setImageToReplace] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error("Failed to fetch images:", err));
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('art-favorites');
    if (savedFavorites) {
      const loaded = JSON.parse(savedFavorites);
      const resized = Array(FAVORITES_SIZE).fill(null);
      for(let i = 0; i < FAVORITES_SIZE; i++) {
        if(loaded[i]) resized[i] = loaded[i];
      }
      setFavorites(resized);
    }
  }, []);

  const updateFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    localStorage.setItem('art-favorites', JSON.stringify(newFavorites));
  };

  const handleDragStart = (e, image) => {
    e.dataTransfer.setData("imageId", image.id);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const imageId = e.dataTransfer.getData("imageId");
    const draggedImage = images.find(img => img.id === imageId);

    if (!draggedImage || favorites.some(fav => fav && fav.id === draggedImage.id)) {
      return; // Image not found or already in favorites
    }

    const newFavorites = [...favorites];
    const isFull = !newFavorites.some(slot => slot === null);

    if (isFull) {
      newFavorites[dropIndex] = draggedImage;
    } else {
      if (newFavorites[dropIndex] === null) {
        newFavorites[dropIndex] = draggedImage;
      } else {
        const firstEmptyIndex = newFavorites.findIndex(slot => slot === null);
        if (firstEmptyIndex !== -1) {
          newFavorites[firstEmptyIndex] = draggedImage;
        }
      }
    }
    updateFavorites(newFavorites);
  };

  const handleJump = () => {
    const imageNumber = parseInt(jumpTo, 10);
    if (swiper && imageNumber > 0 && imageNumber <= images.length) {
      swiper.slideToLoop(imageNumber - 1);
    }
  };

  const handleAddToFavorites = () => {
    if (!swiper || images.length === 0) return;

    const currentImage = images[swiper.realIndex];
    if (!currentImage) return;

    if (favorites.some(fav => fav && fav.id === currentImage.id)) {
      // Image already in favorites
      return;
    }

    const firstEmptyIndex = favorites.findIndex(slot => slot === null);

    if (firstEmptyIndex !== -1) {
      const newFavorites = [...favorites];
      newFavorites[firstEmptyIndex] = currentImage;
      updateFavorites(newFavorites);
    } else {
      // List is full, enter replacement mode
      setReplacementMode(true);
      setImageToReplace(currentImage);
    }
  };

  const handleCancelReplacement = () => {
    setReplacementMode(false);
    setImageToReplace(null);
  };

  const handleFavoriteSlotClick = (index) => {
    if (replacementMode && imageToReplace) {
      const newFavorites = [...favorites];
      newFavorites[index] = imageToReplace;
      updateFavorites(newFavorites);
      setReplacementMode(false);
      setImageToReplace(null);
    } else if (favorites[index]) {
      setSelectedImage(favorites[index]); // Existing modal logic
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <h1>Michi's First(?) Outfit Design Competition!!</h1>
        <div className="jump-section">
          <input
            type="number"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJump()}
            min="1"
            max={images.length}
            className="jump-input"
            placeholder="#"
          />
          <button onClick={handleJump} className="jump-button">Go</button>
        </div>
        <div className="carousel-container">
          {images.length > 0 ? (
            <Swiper
              modules={[Navigation]}
              navigation
              loop
              spaceBetween={50}
              slidesPerView={1}
              className="art-carousel"
              onSwiper={setSwiper}
              allowTouchMove={false}
            >
              {images.map((image) => (
                <SwiperSlide key={image.id}>
                  <div
                    className="art-item"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, image)}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image.image_url} alt={image.theme} />
                    <div className="art-info">
                      <p><strong>#{image.id}</strong> {image.theme || 'Untitled'}</p>
                      <p>by {image.artist || 'Unknown Artist'}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="art-carousel">Loading...</div>
          )}
        </div>
        <div className="add-to-favorites-section">
          {!replacementMode ? (
            <button onClick={handleAddToFavorites} className="jump-button">Add to Favorites</button>
          ) : (
            <div className="replacement-mode-controls">
              <span>Click a slot to replace or </span>
              <button onClick={handleCancelReplacement} className="jump-button">Cancel</button>
            </div>
          )}
        </div>
      </main>

      <aside className="favorites-sidebar">
        <h2>Your Top 5</h2>
        <div className="favorites-list">
          {favorites.map((fav, index) => (
            <div
              key={index}
              className={`favorite-slot ${dragOverIndex === index ? 'drag-over' : ''} ${replacementMode ? 'replacement-mode' : ''}`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleFavoriteSlotClick(index)}
            >
              {fav ? (
                <div className="favorite-item-container">
                  <img
                    src={fav.image_url}
                    alt={fav.theme}
                    onClick={() => setSelectedImage(fav)}
                  />
                  <div className="favorite-item-label">#{fav.id}</div>
                </div>
              ) : (
                <div className="empty-slot">{index + 1}</div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {selectedImage && (
        <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img src={selectedImage.image_url} alt={selectedImage.theme} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;