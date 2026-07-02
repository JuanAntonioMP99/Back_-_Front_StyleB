import React, { useState } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images, altText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    return (
        <div className="carousel-image-container">
            <div className="carousel-slide">
                <img 
                    src={images[currentIndex]} 
                    alt={`${altText} - Vista ${currentIndex + 1}`} 
                    className="carousel-image"
                />
            </div>
            
            {/* Solo mostramos controles si hay más de una imagen */}
            {images.length > 1 && (
                <>
                    <button onClick={prevSlide} className="carousel-btn prev-btn">❮</button>
                    <button onClick={nextSlide} className="carousel-btn next-btn">❯</button>
                    
                    <div className="carousel-indicators">
                        {images.map((_, index) => (
                            <span 
                                key={index} 
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                            ></span>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;