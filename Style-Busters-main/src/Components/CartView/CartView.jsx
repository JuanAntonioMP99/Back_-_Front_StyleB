import { useCart } from "../../context/CartContext";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";

export default function CartView() {
  const { items, removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-view">
      <div className="cart-view-header">
        <h2>
          {items.length} {items.length === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      {items &&
        items.map(({product, quantity}) => (
          <div className="cart-item" key={product._id}>
            <div className="cart-item-image">
              <img src={product?.imagesUrl?.[0]} alt={product.name} loading="lazy" />
            </div>

            <div className="cart-item-info">
              <h3>{product.name}</h3>
              <p className="cart-item-price">{`$${product.price.toFixed(2)}`}</p>
            </div>

            <div className="cart-item-quantity">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateQuantity(product._id, quantity - 1)}
              >
                <Icon name="minus" size={15}></Icon>
              </Button>
              <span>{quantity}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateQuantity(product._id, quantity + 1)}
              >
                <Icon name="plus" size={15}></Icon>
              </Button>
            </div>

            <div className="cart-item-total">
              ${(product.price * quantity).toFixed(2)}
            </div>

            <Button
              variant="ghost"
              className="danger"
              size="sm"
              onClick={() => removeItem(product._id)}
              title="Eliminar artículo"
            >
              <Icon name="trash" size={16} />
            </Button>
          </div>
        ))}
    </div>
  );
}