import { useState, useEffect } from "react";
import Icon from '../Common/Icon/Icon';
import Button from "../Common/Button/Button";
import './BannerCarousel.css';

export default function BannerCarousel({ banners = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Qué slides tienen ya su <img> en el DOM. Arranca solo con el primero: es
    // el LCP de la portada y antes los tres fondos se descargaban a la vez,
    // compitiendo por ancho de banda con la imagen realmente visible.
    const [mountedSlides, setMountedSlides] = useState(() => new Set([0]));

    // Tras el primer pintado se precarga el slide siguiente, para que el
    // cross-fade no muestre un hueco. El resto entra al llegarles el turno.
    useEffect(() => {
        if (banners.length <= 1) return;
        const next = (currentIndex + 1) % banners.length;
        setMountedSlides((prev) => {
            if (prev.has(currentIndex) && prev.has(next)) return prev;
            const updated = new Set(prev);
            updated.add(currentIndex);
            updated.add(next);
            return updated;
        });
    }, [currentIndex, banners.length]);

    useEffect(() => {
        if (banners.length <= 1) return; 

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const goToSlide = (index) => {
        if (isTransitioning || index === currentIndex) return; 
        
        setIsTransitioning(true);
        setCurrentIndex(index);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    // CORRECCIÓN 1: Agregado 'const' para definir la función
    const goToPrevious = () => {
        if (isTransitioning) return; 
        
        setIsTransitioning(true);
        setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    // CORRECCIÓN 1: Agregado 'const' para definir la función
    const goToNext = () => {
        if (isTransitioning) return; 
        
        setIsTransitioning(true);
        setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    const handleKeyDown = (e, action) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            action();
        }
    };

    if (banners.length === 0) {
        return (
            <div className="banner-carousel">
                <div className="banner-empty">
                    {/* CORRECCIÓN 2: Uso de tu componente Icon */}
                    <Icon name="image" size={48} />
                    <h3>No hay banners disponibles</h3>
                    <p>Los banners aparecerán aquí cuando estén disponibles</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="banner-carousel">
            <div className="carousel-container" role="region" aria-label="Carrusel de banners promocionales">
                <div className="slides-wraper">
                    {banners.map((banner, index) => {
                        return (
                            <div key={banner.id || index} className={`banner-slide ${index === currentIndex ? "active" : ""
                                    } ${index === currentIndex - 1 ||
                                        (currentIndex === 0 && index === banners.length - 1)
                                        ? "prev"
                                        : ""
                                    } ${index === currentIndex + 1 ||
                                        (currentIndex === banners.length - 1 && index === 0)
                                        ? "next"
                                        : ""
                                    }`}
                                style={{ backgroundColor: banner.backgroundColor }}
                                aria-hidden={index !== currentIndex}>
                                    {/* <img> en vez de background-image en CSS: el
                                        preload scanner del navegador no descubre
                                        los fondos declarados por estilo en línea,
                                        así que el LCP arrancaba tarde. Con <img>
                                        se descubre en el HTML inicial y admite
                                        fetchPriority. */}
                                    {mountedSlides.has(index) && (
                                        <img
                                            className="banner-image"
                                            src={banner.image}
                                            alt=""
                                            aria-hidden="true"
                                            decoding="async"
                                            loading={index === 0 ? "eager" : "lazy"}
                                            fetchPriority={index === 0 ? "high" : "low"}
                                        />
                                    )}
                                    <div className="banner-overlay"></div>
                                    <div className="banner-content">
                                        <div className="content-wrapper">
                                            <h1 className="banner-title">{banner.title}</h1>
                                            {/* CORRECCIÓN 3: Eliminado el typo '{}' antes de banner.subtitle */}
                                            <p className="banner-subtitle">{banner.subtitle}</p>
                                            
                                            <div className="banner-actions">
                                                {/* CORRECCIÓN 4: Uso de tu componente Button */}
                                                <Button
                                                    variant="primary"
                                                    size="large" // Asegúrate de que tu CSS soporte 'btn-large' si usas este prop
                                                    onClick={() => {
                                                        console.log(`Navegando a: ${banner.buttonLink}`);
                                                    }}
                                                    aria-label={`${banner.buttonText} - ${banner.title}`}
                                                >
                                                    {banner.buttonText}
                                                </Button>
                                                
                                                {banner.secondaryButton && (
                                                    <Button
                                                        variant="secondary"
                                                        size="large"
                                                        onClick={() =>
                                                            console.log(`Acción secundaria: ${banner.title}`)
                                                        }
                                                    >
                                                        {banner.secondaryButton}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        );
                    })}
                </div>

                {banners.length > 1 && (
                    <>
                        <button
                            className="carousel-btn carousel-btn-prev"
                            onClick={goToPrevious}
                            onKeyDown={(e) => handleKeyDown(e, goToPrevious)}
                            aria-label="Banner anterior"
                            disabled={isTransitioning}
                        >
                            {/* CORRECCIÓN 2: Uso de tu componente Icon */}
                            <Icon name="chevronLeft" size={24} />
                        </button>

                        <button
                            className="carousel-btn carousel-btn-next"
                            onClick={goToNext}
                            onKeyDown={(e) => handleKeyDown(e, goToNext)}
                            aria-label="Banner siguiente"
                            disabled={isTransitioning}
                        >
                            {/* CORRECCIÓN 2: Uso de tu componente Icon */}
                            <Icon name="chevronRight" size={24} />
                        </button>
                    </>
                )}

                {banners.length > 1 && (
                    <div className="carousel-indicators" role="tablist">
                        {banners.map((banner, index) => (
                            <button
                                key={banner.id || index}
                                className={`indicator ${index === currentIndex ? "active" : ""
                                    }`}
                                onClick={() => goToSlide(index)}
                                onKeyDown={(e) => handleKeyDown(e, () => goToSlide(index))}
                                aria-label={`Ir al banner ${index + 1}: ${banner.title}`}
                                role="tab"
                                aria-selected={index === currentIndex}
                                disabled={isTransitioning}
                            />
                        ))}
                    </div>
                )}

                <div className="carousel-progress">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${((currentIndex + 1) / banners.length) * 100}%`,
                        }}
                    ></div>
                </div>

                <div className="banner-counter">
                    <span>{currentIndex + 1}</span>
                    <span className="divider">/</span>
                    <span>{banners.length}</span>
                </div>

            </div>
        </div>
    );
}