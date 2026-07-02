import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Ajusta la ruta

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirige al login, pero guarda la ubicación actual en state.from
        return <Navigate to="/login" state={{ from: { pathname: location.pathname } }} replace />;
    }
    return children;
};

export default ProtectedRoute;