import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './App.css';

const API_URL = 'https://art-gallery-api.doyoonsung.workers.dev/';

function App() {
  const [images, setImages] = useState([]);
  const [favorites, setFavorites] = useState(Array(10).fill(null));
  const [selectedImage, setSelectedImage] = useState(null);
  const [swiper, setSwiper] = useState(null);
  const [jumpTo, setJumpTo] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error("Failed to fetch images:", err));
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('art-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination || source.droppableId !== 'carousel' || destination.droppableId !== 'favorites') {
      return;
    }

    const newFavorites = [...favorites];
    const draggedImage = images[source.index];

    if (favorites.some(fav => fav && fav.id === draggedImage.id)) {
      return;
    }

    const firstEmptyIndex = favorites.findIndex(slot => slot === null);

    if (firstEmptyIndex !== -1) {
      newFavorites[firstEmptyIndex] = draggedImage;
    } else {
      newFavorites[destination.index] = draggedImage;
    }

    setFavorites(newFavorites);
    localStorage.setItem('art-favorites', JSON.stringify(newFavorites));
  };

  const handleJump = () => {
    const imageNumber = parseInt(jumpTo, 10);
    if (swiper && imageNumber > 0 && imageNumber <= images.length) {
      swiper.slideTo(imageNumber - 1);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <main className="main-content">
          <h1>Art Gallery</h1>
          <Droppable droppableId="carousel" direction="horizontal" isDropDisabled={true}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="carousel-container">
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={50}
                  slidesPerView={1}
                  className="art-carousel"
                  onSwiper={setSwiper}
                  allowTouchMove={false}
                >
                  {images.map((image, index) => (
                    <SwiperSlide key={image.id}>
                      <Draggable draggableId={image.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="art-item"
                            onClick={() => setSelectedImage(image)} // Click to enlarge
                          >
                            <img src={image.image_url} alt={image.theme} />
                            <div className="art-info">
                              <p><strong>#{image.id}</strong> {image.theme || 'Untitled'}</p>
                              <p>by {image.artist || 'Unknown Artist'}</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    </SwiperSlide>
                  ))}
                </Swiper>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="navigation-controls">
            <button onClick={() => swiper?.slidePrev()} className="nav-button">Prev</button>
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
            <button onClick={() => swiper?.slideNext()} className="nav-button">Next</button>
          </div>
        </main>

        <aside className="favorites-sidebar">
          <h2>Your Top 10</h2>
          <Droppable droppableId="favorites" direction="vertical">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="favorites-list">
                {favorites.map((fav, index) => (
                  <div key={index} className="favorite-slot">
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </aside>

        {selectedImage && (
          <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
            <div className="modal-content">
              <img src={selectedImage.image_url} alt={selectedImage.theme} />
               <div className="art-info">
                  <p><strong>#{selectedImage.id}</strong> {selectedImage.theme || 'Untitled'}</p>
                  <p>by {selectedImage.artist || 'Unknown Artist'} ({selectedImage.sns_tag})</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default App;