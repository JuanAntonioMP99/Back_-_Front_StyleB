import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/AuthContext';
import './Header.css';
import Icon from '../../Common/Icon/Icon';

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  
  
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    if (query) {
      setSearchQuery(query);
    } else if (location.pathname !== "/search") {
      setSearchQuery("");
    }
  }, [location]);
  const handleSearch = (e) => {
    e.preventDefault();
    
    
    if (searchQuery.trim().length === 0) {
      navigate("/search");
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <header className="layout-header">
                <div className="container header-content">
                    <Link to="/" className="logo">
                        Style Busters
                    </Link>
                    <div className="search-container desktop-only">
                      <form className="search-form" onSubmit={handleSearch}>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Buscar productos..."
                          value={searchQuery}
                          onChange={(e) => {
                            console.log(e.target.value);
                            setSearchQuery(e.target.value);
                          }}
                        />
                        <button
                          type="submit"
                          className="search-btn"
                          aria-label="Buscar"
                        >
                          <Icon name="search" size={18} />
                        </button>
                      </form>
                    </div>
                    <nav className="main-nav">
                        <Link to="/">Catálogo</Link>
                        <Link to="/cart" className="cart-link">
                            Carrito
                            {totalItems > 0 && (
                                <span className="cart-badge">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        {user ? (
                            <div className="user-section">
                                <span className="user-greeting">Hola, {user.name}</span>
                                <button onClick={logout} className="btn-secondary logout-btn">
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <Link 
                              to="/login" 
                              state={{ from: { pathname: location.pathname } }} 
                            >
                              Login
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
  );
}
