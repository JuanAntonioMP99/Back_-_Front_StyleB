import Button from "../Common/Button/Button";
import CartView from "../Components/CartView/CartView";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import "./CartPage.css";
import { useAuth } from "../Context/AuthContext";


export default function CartPage() {
    const navigate = useNavigate();
    const {cart} = useCart();
    const { user } = useAuth();
    
    const handleCheckout = () => {
        if (user) {
            navigate('/checkout');
        } else {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
        }
     };
    return (
        <div>
            <CartView>
                
            </CartView>
            
            {cart.length > 0 && (
            <Button
                variant="primary"
                onClick={handleCheckout}
                className="btn-primary checkout-btn"
                size="lg"
            >
                Proceder al Pago
            </Button>
            )}
        </div>
        
    )
}