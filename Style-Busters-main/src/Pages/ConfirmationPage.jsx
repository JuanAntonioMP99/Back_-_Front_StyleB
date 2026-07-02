import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useEffect } from 'react';
import './ConfirmationPage.css';

const ConfirmationPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { order } = location.state || {};

    useEffect(() => {
    if (!order) {
        navigate("/");
        return;
    }
    }, [order, navigate]);

    return (
        <div className="confirmation-container">
            <div className="confirmation-icon">
                ✓
            </div>
            <h1 className="confirmation-title">¡Gracias por tu compra{user ? `, ${user.name}` : ''}!</h1>
            <p className="confirmation-message">
                Tu pedido ha sido procesado con éxito. Te enviaremos un correo con los detalles.
            </p>

            <Link to="/" className="btn-primary continue-shopping-btn">
                Seguir Comprando
            </Link>
        </div>
    );
};

export default ConfirmationPage;