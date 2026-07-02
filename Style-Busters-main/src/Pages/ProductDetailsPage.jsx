import { useParams, useNavigate } from 'react-router-dom';
import products from '../Data/products';
import { useCart } from '../Context/CartContext';
import ImageCarousel from '../Components/ImageCarousel/ImageCarousel';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const product = products.find(p => p.id === parseInt(id));

    if (!product) {
        return (
            <div className="product-not-found">
                <h2>Producto no encontrado</h2>
                <button onClick={() => navigate('/')} className="btn-secondary back-btn">
                    Volver al catálogo
                </button>
            </div>
        );
    }
    

    return (
        <div className="product-detail-container">
            <div className="product-image-section">
                <ImageCarousel 
                    images={product.image} 
                    altText={product.name} 
                />
            </div>

            <div>
                <div className="product-detail-category">
                    {product.category}
                </div>
                <h1 className="product-detail-title">{product.name}</h1>
                <div className="product-detail-price">
                    ${product.price.toFixed(2)}
                </div>

                <p className="product-detail-description">
                    {product.description}
                </p>

                <div className="product-detail-actions">
                    <button
                        onClick={() => addToCart(product)}
                        className="btn-primary add-to-cart-btn"
                    >
                        Agregar al Carrito
                    </button>
                    {/* TODO: Implementar lista de deseos */}
                    <button className="btn-secondary wishlist-btn">
                        ♥
                    </button>
                </div>

                <div className="product-specs">
                    <h3 className="specs-title">Detalles</h3>
                    <ul className="specs-list">
                        <li className="specs-item">• 100% Algodón</li>
                        <li className="specs-item">• Estampado de alta durabilidad</li>
                        <li className="specs-item">• Corte Unisex</li>
                        <li className="specs-item">• Unitalla</li>
                        <li className="specs-item">• Color Unico</li>
                        <li>• Hecho en México</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
