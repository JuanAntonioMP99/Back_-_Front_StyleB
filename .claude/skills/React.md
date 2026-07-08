# React - Modern UI Development

**Scope:** frontend
**Trigger:** cuando se trabaje con React, se creen componentes, se use hooks, o se mencione desarrollo de UI con React
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para crear aplicaciones React modernas usando las últimas versiones y mejores prácticas. Cubre desde setup hasta patrones avanzados de componentes, hooks, y optimización.

## Cuándo Usar Esta Skill

- Crear proyectos React desde cero
- Desarrollar componentes reutilizables
- Implementar hooks (useState, useEffect, customs)
- Configurar routing con React Router
- Manejar estado con Context API
- Optimizar performance de aplicaciones React
- Refactorizar componentes existentes
- Integrar con APIs backend

## Contexto y Conocimiento

### Versión Actual
React 18+ (siempre usa la última versión estable)

### Herramientas de Setup

**Vite (Recomendado - Más rápido):**
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

**Create React App (Estable):**
```bash
npx create-react-app my-app
cd my-app
npm start
```

### Estructura Recomendada de Proyecto

```
src/
├── components/
│   ├── common/          # Button, Input, Card, Modal
│   ├── layout/          # Header, Footer, Sidebar, Layout
│   └── features/        # UserProfile, ProductCard, OrderList
├── pages/               # Home, About, Dashboard, Login
├── hooks/               # useAuth, useFetch, useForm
├── context/             # AuthContext, ThemeContext
├── services/            # api.js, authService.js
├── utils/               # helpers, formatters, validators
├── assets/              # images, icons, fonts
├── styles/              # global styles, variables
├── App.jsx
└── main.jsx
```

## Flujo de Trabajo

### 1. Setup de Proyecto Nuevo

```bash
# Crear proyecto con Vite
npm create vite@latest project-name -- --template react

# Instalar dependencias comunes
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer

# (Opcional) TypeScript
npm create vite@latest project-name -- --template react-ts
```

### 2. Configuración Inicial

**Tailwind CSS (si se usa):**
```bash
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Estructura de Componentes

**Componente Funcional Básico:**
```jsx
import React from 'react';

const Button = ({ children, onClick, variant = 'primary', disabled = false }) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
};

export default Button;
```

**Componente con Estado:**
```jsx
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  // 1. Estado
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Effects
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]); // Dependency array

  // 3. Render condicional
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
```

## Hooks Esenciales

### useState - Estado Local

```jsx
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: '', email: '' });
const [items, setItems] = useState([]);

// Actualizar estado
setCount(count + 1);
setCount(prev => prev + 1); // Preferido para basarse en valor previo

// Estado de objeto
setUser({ ...user, name: 'John' });
setUser(prev => ({ ...prev, email: 'john@example.com' }));

// Estado de array
setItems([...items, newItem]);
setItems(prev => [...prev, newItem]);
```

### useEffect - Side Effects

```jsx
// 1. Ejecutar una vez (componentDidMount)
useEffect(() => {
  console.log('Component mounted');
}, []);

// 2. Ejecutar cuando cambia dependencia
useEffect(() => {
  fetchData(userId);
}, [userId]);

// 3. Cleanup (componentWillUnmount)
useEffect(() => {
  const subscription = subscribeToData();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// 4. Múltiples dependencias
useEffect(() => {
  if (isAuthenticated && userId) {
    loadUserData();
  }
}, [isAuthenticated, userId]);
```

### Custom Hooks

**useAuth:**
```jsx
import { useState, useContext, createContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**useFetch (Generic):**
```jsx
import { useState, useEffect } from 'react';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetch;
```

**useForm:**
```jsx
import { useState } from 'react';

const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      callback(values);
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  };
};

export default useForm;
```

## React Router

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />

          {/* Rutas protegidas */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="login" element={<Login />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Protected Route Component:**
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
```

## Optimización de Performance

### React.memo - Prevenir Re-renders

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
  console.log('ExpensiveComponent rendered');
  return (
    <div>
      {/* Componente pesado */}
    </div>
  );
});

export default ExpensiveComponent;
```

### useMemo - Memoizar Cálculos

```jsx
import { useMemo } from 'react';

const ProductList = ({ products, filter }) => {
  // Solo recalcula cuando products o filter cambian
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### useCallback - Memoizar Funciones

```jsx
import { useCallback, useState } from 'react';

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  // Esta función solo se recrea si setItems cambia (nunca)
  const handleAddItem = useCallback((item) => {
    setItems(prev => [...prev, item]);
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ChildComponent onAddItem={handleAddItem} />
    </div>
  );
};
```

## Patrones Comunes

### Compound Components

```jsx
const Tabs = ({ children, defaultActive = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);

  return (
    <div className="tabs">
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          isActive: index === activeIndex,
          onActivate: () => setActiveIndex(index),
        })
      )}
    </div>
  );
};

const Tab = ({ label, children, isActive, onActivate }) => (
  <div>
    <button
      onClick={onActivate}
      className={isActive ? 'active' : ''}
    >
      {label}
    </button>
    {isActive && <div className="tab-content">{children}</div>}
  </div>
);

// Uso
<Tabs>
  <Tab label="Tab 1">Content 1</Tab>
  <Tab label="Tab 2">Content 2</Tab>
  <Tab label="Tab 3">Content 3</Tab>
</Tabs>
```

### Render Props

```jsx
const DataFetcher = ({ url, render }) => {
  const { data, loading, error } = useFetch(url);
  return render({ data, loading, error });
};

// Uso
<DataFetcher
  url="/api/users"
  render={({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <UserList users={data} />;
  }}
/>
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Infinite re-renders | useEffect sin dependencies | Agregar array de dependencias `[]` |
| State no actualiza | Mutación directa del estado | Usar spread operator: `{ ...state }` |
| Memory leak | useEffect sin cleanup | Retornar función de cleanup |
| Stale closure | Variables capturadas en closure | Usar refs o dependencies correctas |
| Props drilling | Pasar props por muchos niveles | Usar Context API o state management |
| Key warnings | Missing/duplicate keys | Usar IDs únicos, no índices |

## Integración con APIs

**Service Layer (services/api.js):**
```jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  get: (endpoint) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(handleResponse),

  post: (endpoint, data) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }).then(handleResponse),

  put: (endpoint, data) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (endpoint) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(handleResponse),
};
```

## Checklist de Validación

Antes de finalizar un componente React:
- [ ] Nombre del componente en PascalCase
- [ ] Props desestructuradas con valores por defecto
- [ ] Estado manejado correctamente (no mutación)
- [ ] useEffect tiene array de dependencias correcto
- [ ] Funciones pesadas memoizadas (useMemo/useCallback)
- [ ] Manejo de estados: loading, error, success
- [ ] Keys únicas en listas
- [ ] No hay console.log en producción
- [ ] Componente es reutilizable
- [ ] Responsive design (mobile-first)

## Best Practices

1. **Componentes pequeños y enfocados** - Una responsabilidad por componente
2. **Props bien tipadas** - Usa PropTypes o TypeScript
3. **Composición sobre herencia** - Combina componentes pequeños
4. **Custom hooks para lógica compartida** - DRY principle
5. **Lazy loading para rutas** - Mejor performance inicial
6. **Error boundaries** - Captura errores de componentes
7. **Accessibility** - Usa semantic HTML y ARIA attributes
8. **Testing** - Unit tests para hooks y components

---

**Última actualización:** Fase 2 - Skills MERN
**Mantenedor:** Sistema de Skills
**Siguiente:** Integrar con Express backend para apps fullstack
