import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import Input from '../../Common/Input/Input';
import Button from '../../Common/Button/Button';
import './LoginForm.css'; 

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    
    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = login(formData.email, formData.password);

        if (result.success) {
            navigate(from, { replace: true }); 
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Iniciar Sesión</h2>
                <p>Ingresa para continuar con tu compra</p>
                
                <form onSubmit={handleSubmit}>
                    <Input 
                        id="email"
                        label="Correo Electrónico"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ingresa cualquier correo"
                    />
                    <Input 
                        id="password"
                        label="Contraseña"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Ingresa: 123456"
                    />
                    
                    {error && <p className="error-msg">{error}</p>}

                    <Button type="submit" variant="primary" className="w-full">
                        Entrar
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;