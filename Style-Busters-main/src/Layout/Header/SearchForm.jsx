import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../Components/Common/Icon/Icon";

/**
 * Formulario de búsqueda (versión escritorio y móvil).
 *
 * El texto tecleado vive aquí y no en <Header />: antes cada pulsación
 * re-renderizaba todo el Header (sus ~15 <Icon />) y el <Navigation /> completo.
 * Ahora el re-render por tecla se limita a este input.
 */
export default function SearchForm({
  variant = "desktop",
  autoFocus = false,
  onSubmitted,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query.length === 0 ? "/search" : `/search?q=${encodeURIComponent(query)}`);
    if (onSubmitted) onSubmitted();
  };

  const isMobile = variant === "mobile";

  return (
    <form
      className={isMobile ? "mobile-search-form" : "search-form"}
      onSubmit={handleSearch}
    >
      {isMobile && (
        <button
          type="button"
          className="mobile-search-back"
          onClick={onSubmitted}
          aria-label="Cerrar búsqueda"
        >
          <Icon name="arrowLeft" size={20} />
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        className={isMobile ? "mobile-search-input" : "search-input"}
        placeholder="Buscar productos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button
        type="submit"
        className={isMobile ? "mobile-search-btn" : "search-btn"}
        aria-label="Buscar"
      >
        <Icon name="search" size={isMobile ? 20 : 18} />
      </button>
    </form>
  );
}
