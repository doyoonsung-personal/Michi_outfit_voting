import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Virtual } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/virtual';
import './App.css';

const API_URL = 'https://art-gallery-api.doyoonsung.workers.dev/';
const FAVORITES_SIZE = 5;

function App() {
  const [images, setImages] = useState([]);
  const [loadedSlides, setLoadedSlides] = useState({});
  const [favorites, setFavorites] = useState(Array(FAVORITES_SIZE).fill(null));
  const [selectedImage, setSelectedImage] = useState(null);
  const [swiper, setSwiper] = useState(null);
  const [jumpTo, setJumpTo] = useState('');
  const [replacementMode, setReplacementMode] = useState(false);
  const [imageToReplace, setImageToReplace] = useState(null);
  const modalContentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const loadSlides = (swiperInstance) => {
    const { from, to } = swiperInstance.virtual;
    const newLoadedSlides = { ...loadedSlides };
    for (let i = from; i <= to; i++) {
      if (!newLoadedSlides[i]) {
        newLoadedSlides[i] = images[i];
      }
    }
    setLoadedSlides(newLoadedSlides);
  };

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setImages(data);
        const initialSlides = {};
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          initialSlides[i] = data[i];
        }
        setLoadedSlides(initialSlides);
      })
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
      return;
    }

    const firstEmptyIndex = favorites.findIndex(slot => slot === null);

    if (firstEmptyIndex !== -1) {
      const newFavorites = [...favorites];
      newFavorites[firstEmptyIndex] = currentImage;
      updateFavorites(newFavorites);
    } else {
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
    } else if (favorites[index] && !replacementMode) { // Only view in full if not in replacement mode
      setSelectedImage(favorites[index]);
    }
  };

  const handleMouseDown = (e) => {
    if (modalContentRef.current) {
        setIsDragging(true);
        dragStartPos.current = { x: e.pageX, y: e.pageY };
        setDragStart({
            x: e.pageX,
            y: e.pageY,
            scrollLeft: modalContentRef.current.scrollLeft,
            scrollTop: modalContentRef.current.scrollTop,
        });
    }
  };

  const handleMouseMove = (e) => {
      if (!isDragging || !modalContentRef.current) return;
      e.preventDefault();
      const x = e.pageX;
      const y = e.pageY;
      const walkX = x - dragStart.x;
      const walkY = y - dragStart.y;
      modalContentRef.current.scrollLeft = dragStart.scrollLeft - walkX;
      modalContentRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUp = (e) => {
      setIsDragging(false);
      const dragEndPos = { x: e.pageX, y: e.pageY };
      const moved = Math.abs(dragStartPos.current.x - dragEndPos.x) > 3 || Math.abs(dragStartPos.current.y - dragEndPos.y) > 3;
      if (!moved) {
        setSelectedImage(null);
      }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="carousel-container">
          {images.length > 0 ? (
            <Swiper
              modules={[Navigation, Virtual]}
              navigation
              loop
              spaceBetween={50}
              slidesPerView={1}
              className="art-carousel"
              onSwiper={(swiper) => {
                setSwiper(swiper);
              }}
              virtual
              onSlideChange={(swiper) => {
                const proximity = 4;
                const newLoadedSlides = { ...loadedSlides };
                let changed = false;
                for (let i = swiper.realIndex - proximity; i <= swiper.realIndex + proximity; i++) {
                  const loopedIndex = (i + images.length) % images.length;
                  if (!newLoadedSlides[loopedIndex] && images[loopedIndex]) {
                    newLoadedSlides[loopedIndex] = images[loopedIndex];
                    changed = true;
                  }
                }
                if (changed) {
                  setLoadedSlides(newLoadedSlides);
                }
              }}
            >
              {images.map((image, index) => (
                <SwiperSlide key={image.id} virtualIndex={index}>
                  {loadedSlides[index] ? (
                    <div
                      className="art-item"
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="art-image-wrapper">
                        <img src={image.image_url} alt={image.theme} />
                      </div>
                      <div className="art-info">
                        <p><strong>#{image.id}</strong> {image.theme || 'Untitled'}</p>
                        <p>by {image.artist || 'Unknown Artist'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="art-item">Loading...</div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="art-carousel">Loading...</div>
          )}
        </div>
        <div className="add-to-favorites-section">
          <div className="jump-section">
            <span>Go to number: </span>
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
              className={`favorite-slot ${replacementMode ? 'replacement-mode' : ''}`}
              onClick={() => handleFavoriteSlotClick(index)}
            >
              {fav ? (
                <div className="favorite-item-container">
                  <img
                    src={fav.image_url}
                    alt={fav.theme}
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
        <div className="modal-backdrop">
          <div
            className="modal-content"
            ref={modalContentRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img src={selectedImage.image_url} alt={selectedImage.theme} onDragStart={(e) => e.preventDefault()} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
