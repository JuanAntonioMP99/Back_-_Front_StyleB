import { Link } from 'react-router-dom';
import { useCart } from '../../Context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <div className="product-card">
            <Link to={`/product/${product.id}`} className="product-image-link">
                <img
                    src={product.image[0]}
                    alt={product.name}
                    className="product-image"
                />
            </Link>

            <div className="product-info">
                <div className="product-category">
                    {product.category}
                </div>
                <Link to={`/product/${product.id}`} className="product-title">
                    {product.name}
                </Link>
                <div className="product-price">
                    ${product.price.toFixed(2)}
                </div>

                <div className="product-actions">
                    <Link to={`/product/${product.id}`} className="btn-secondary action-btn">
                        Ver Detalle
                    </Link>
                    <button
                        onClick={() => addToCart(product)}
                        className="btn-primary action-btn"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
