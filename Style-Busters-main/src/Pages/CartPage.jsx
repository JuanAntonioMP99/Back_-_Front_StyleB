import { useNavigate } from "react-router-dom";
import CartView from "../Components/CartView/CartView";
import Button from "../Components/Common/Button";
import Icon from "../Components/Common/Icon/Icon";
import { useCart } from "../Context/CartContext";
import "./CartPage.css";

export default function Cart() {
  const { items, clearCart, count, total,  } = useCart();

  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <Icon name="cart" size={100}></Icon>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega algunos productos para empezar a comprar</p>
        <Button variant="primary" onClick={() => navigate("/")}>
          <span>Continuar Comprando</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <div className="cart-header-title">
          <Icon name="cart" size={32} />
          <h1>Carrito de Compras</h1>
        </div>
        <div className="cart-header-info">
          <span className="cart-items-count">
            {count} {count === 1 ? "artículo" : "artículos"}
          </span>
          <Button
            variant="ghost"
            className="danger clear-cart-btn"
            onClick={clearCart}
            title="Vaciar carrito"
            size="sm"
          >
            <Icon name="trash" size={18} />
            <span>Vaciar carrito</span>
          </Button>
        </div>
      </div>

      <div className="cart-items">
        <CartView />
        <div className="cart-summary">
          <div className="cart-total">
            <span className="cart-total-subtitle">Total a pagar</span>
            <h2 data-testid="cart-subtotal">${total.toFixed(2)}</h2>
          </div>
          <div className="cart-actions">
            <Button
              variant="primary"
              onClick={() => navigate("/checkout")}
              size="lg"
              data-testid="cart-checkout-button"
              disabled={!items || items.length === 0}
              title={
                !items || items.length === 0
                  ? "Agrega productos al carrito para continuar"
                  : "Proceder al pago"
              }
            >
              <Icon name="creditCard" size={20} />
              <span>Proceder al pago</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}