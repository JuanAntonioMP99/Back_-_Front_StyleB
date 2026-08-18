import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Ajusta la ruta

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Mientras AuthContext restaura la sesión desde el token (useEffect de montaje),
    // no decidimos todavía: evita redirigir a /login en el primer render de una
    // carga completa de página (deep link / F5) antes de restaurar la sesión.
    if (loading) return null;

    if (!isAuthenticated) {
        // Redirige al login, pero guarda la ubicación actual en state.from
        return <Navigate to="/login" state={{ from: { pathname: location.pathname } }} replace />;
    }
    return children;
};

export default ProtectedRoute;