import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './App.css';

// ❗ IMPORTANT: Replace with your actual Cloudflare Worker URL after you deploy it.
const API_URL = 'https://art-gallery-api.doyoonsung.workers.dev/';

function App() {
  const [images, setImages] = useState([]);
  const [favorites, setFavorites] = useState(Array(10).fill(null));
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch data from your Worker API on component load
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error("Failed to fetch images:", err));
  }, []);

  // Load favorites from localStorage when the app starts
  useEffect(() => {
    const savedFavorites = localStorage.getItem('art-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Handle the end of a drag event
  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return; // Dropped outside a valid area

    // Logic for dragging from the carousel to the favorites bar
    if (source.droppableId === 'carousel' && destination.droppableId === 'favorites') {
      const newFavorites = [...favorites];
      const draggedImage = images[source.index];
      
      // Replace the item at the destination index
      newFavorites[destination.index] = draggedImage;
      
      setFavorites(newFavorites);
      localStorage.setItem('art-favorites', JSON.stringify(newFavorites));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <main className="main-content">
          <h1>Art Gallery</h1>
          <Droppable droppableId="carousel" direction="horizontal" isDropDisabled={true}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Swiper spaceBetween={50} slidesPerView={1} className="art-carousel">
                  {images.map((image, index) => (
                    <SwiperSlide key={image.id}>
                      <Draggable draggableId={image.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="art-item"
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
        </main>

        <aside className="favorites-sidebar">
          <h2>Your Top 10</h2>
          <Droppable droppableId="favorites" direction="vertical">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="favorites-list">
                {favorites.map((fav, index) => (
                  <div key={index} className="favorite-slot">
                    {fav ? (
                      <img
                        src={fav.image_url}
                        alt={fav.theme}
                        onClick={() => setSelectedImage(fav)}
                      />
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

        {/* Modal for viewing a selected image */}
        {selectedImage && (
          <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={selectedImage.image_url} alt={selectedImage.theme} />
               <div className="art-info">
                  <p><strong>#{selectedImage.id}</strong> {selectedImage.theme || 'Untitled'}</p>
                  <p>by {selectedImage.artist || 'Unknown Artist'} ({selectedImage.sns_tag})</p>
                </div>
              <button onClick={() => setSelectedImage(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default App;