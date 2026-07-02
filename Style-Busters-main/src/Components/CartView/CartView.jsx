import { Link } from 'react-router-dom';
import { useCart } from '../../Context/CartContext';
import './CartView.css';

const CartView = () => {
    const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
    

    if (cart.length === 0) {
        return (
            <div className="cart-empty-container">
                <h2 className="cart-empty-title">Tu carrito está vacío</h2>
                <p className="cart-empty-text">Parece que aún no has agregado nada.</p>
                <Link to="/" className="btn-primary">
                    Ir a comprar
                </Link>
            </div>
        );
    }
    
    return (
        <div>
            <h1 className="cart-title">Tu Carrito</h1>

            <div className="cart-layout">
                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <img src={item.image[0]} alt={item.name} className="cart-item-image" />

                            <div className="cart-item-details">
                                <h3 className="cart-item-name">{item.name}</h3>
                                <div className="cart-item-price">${item.price.toFixed(2)}</div>
                            </div>

                            <div className="cart-item-quantity">
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="quantity-btn"
                                >
                                    -
                                </button>
                                <span className="quantity-value">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="quantity-btn"
                                >
                                    +
                                </button>
                            </div>

                            <div className="cart-item-total">
                                ${(item.price * item.quantity).toFixed(2)}
                            </div>

                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="remove-btn"
                                title="Eliminar"
                            >
                                &times;
                            </button>
                        </div>
                    ))}

                    <div className="clear-cart-container">
                        <button onClick={clearCart} className="clear-cart-btn">
                            Vaciar carrito
                        </button>
                    </div>
                </div>

                <div className="cart-summary">
                    <h2 className="summary-title">Resumen</h2>

                    <div className="summary-row">
                        <span className="summary-label">Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span className="summary-label">Envío</span>
                        <span className="shipping-free">Gratis</span>
                    </div>

                    <div className="summary-total">
                        <span>Total</span>
                        <span className="total-amount">${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartView;