# Frontend Design - UI/UX Patterns & Systems

**Scope:** frontend
**Trigger:** cuando se diseñen interfaces, se mencionen design systems, atomic design, Tailwind, Material UI, o patrones de UI/UX
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para crear interfaces de usuario profesionales y consistentes usando design systems, atomic design, y frameworks de UI modernos. Cubre desde fundamentos de diseño hasta implementación práctica con Tailwind, Material UI, y patrones enterprise.

## Cuándo Usar Esta Skill

- Crear design system desde cero
- Implementar atomic design
- Configurar Tailwind CSS o Material UI
- Diseñar componentes reutilizables
- Mantener consistencia visual
- Implementar responsive design
- Crear layouts complejos
- Accessibility (a11y) implementation

## Contexto y Conocimiento

### Principios Fundamentales de UI/UX

**1. Consistency (Consistencia)**
- Mismos colores, typography, spacing
- Comportamientos predecibles
- Patrones repetibles

**2. Hierarchy (Jerarquía)**
- Tamaños de texto claros
- Contraste apropiado
- Espaciado intencional

**3. Accessibility (Accesibilidad)**
- Contraste mínimo 4.5:1
- Keyboard navigation
- Screen reader support
- ARIA labels

**4. Feedback**
- Loading states
- Success/error messages
- Hover/active states
- Transitions suaves

## Atomic Design

### Jerarquía de Componentes

```
Atoms (Átomos)
  ->
Molecules (Moléculas)
  ->
Organisms (Organismos)
  ->
Templates
  ->
Pages
```

### 1. Atoms - Componentes Básicos

```typescript
// Button.tsx - Átomo básico
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}) => {
  const baseStyles = 'font-medium rounded transition-colors';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Input.tsx - Otro átomo
interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

### 2. Molecules - Combinación de Átomos

```typescript
// SearchBar.tsx - Molécula
import { Input } from './atoms/Input';
import { Button } from './atoms/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div className="flex gap-2">
      <Input
        value={query}
        onChange={setQuery}
        placeholder="Search..."
      />
      <Button onClick={handleSearch}>
        Search
      </Button>
    </div>
  );
};

// FormField.tsx - Otra molécula
import { Input } from './atoms/Input';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required,
}) => {
  return (
    <div className="mb-4">
      <Input
        label={`${label}${required ? ' *' : ''}`}
        value={value}
        onChange={onChange}
        error={error}
      />
    </div>
  );
};
```

### 3. Organisms - Estructuras Complejas

```typescript
// LoginForm.tsx - Organismo
import { FormField } from './molecules/FormField';
import { Button } from './atoms/Button';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 6) newErrors.password = 'Password must be 6+ chars';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Login</h2>

      <FormField
        label="Email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        required
      />

      <FormField
        label="Password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        required
      />

      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  );
};
```

## Tailwind CSS

### Setup y Configuración

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#6b7280',
          600: '#4b5563',
        }
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Utility Classes Comunes

```typescript
// Layout
<div className="container mx-auto px-4">
<div className="flex justify-between items-center">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<div className="p-4 m-2">        // padding y margin
<div className="mt-8 mb-4">      // margin top/bottom
<div className="space-y-4">      // espacio vertical entre hijos

// Typography
<h1 className="text-4xl font-bold text-gray-900">
<p className="text-base leading-relaxed text-gray-600">

// Colors
<div className="bg-blue-500 text-white">
<div className="border border-gray-300">

// Responsive
<div className="w-full md:w-1/2 lg:w-1/3">
<p className="text-sm md:text-base lg:text-lg">

// States
<button className="hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50">
<input className="focus:ring-2 focus:ring-blue-500">

// Flexbox
<div className="flex flex-col md:flex-row gap-4">
<div className="flex-1">           // grow
<div className="flex-shrink-0">    // no shrink

// Grid
<div className="grid grid-cols-12 gap-4">
<div className="col-span-12 md:col-span-6 lg:col-span-4">
```

### Design Tokens con Tailwind

```typescript
// colors.ts
export const colors = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
};

// spacing.ts
export const spacing = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

// shadows.ts
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};
```

## Material UI (MUI)

### Setup

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
```

### Theme Configuration

```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
});

// App.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <YourApp />
    </ThemeProvider>
  );
}
```

### Componentes MUI

```typescript
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Stack
} from '@mui/material';

function UserCard({ user }) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          {user.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" size="small">
            Edit
          </Button>
          <Button variant="outlined" size="small" color="error">
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
```

## Design Patterns

### 1. Card Pattern

```typescript
interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};
```

### 2. Modal Pattern

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              X
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3. Toast/Notification Pattern

```typescript
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">
        X
      </button>
    </div>
  );
};

// Toast Manager
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<Toast>>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};
```

## Accessibility (a11y)

### Semantic HTML

```typescript
// BIEN - Semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Page Title</h1>
    <p>Content...</p>
  </article>
</main>

// MAL - Div soup
<div>
  <div>
    <div><div>Home</div></div>
    <div><div>About</div></div>
  </div>
</div>
```

### ARIA Labels

```typescript
<button
  aria-label="Close modal"
  onClick={onClose}
>
  X
</button>

<img
  src={user.avatar}
  alt={`${user.name}'s profile picture`}
/>

<input
  type="text"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
{error && (
  <span id="email-error" role="alert">
    {error}
  </span>
)}
```

### Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    onClick();
  }
  if (e.key === 'Escape') {
    onClose();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={onClick}
>
  Click me
</div>
```

## Responsive Design

### Mobile-First Approach

```typescript
// BIEN - Mobile first
<div className="w-full md:w-1/2 lg:w-1/3">
<p className="text-sm md:text-base lg:text-lg">

// Breakpoints en Tailwind
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

### Container Queries (Nuevo)

```css
/* Modern approach con container queries */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Inconsistent spacing | Valores hardcoded | Usar design tokens |
| Poor contrast | Colores sin validar | WCAG checker (4.5:1 mínimo) |
| No keyboard access | Solo onClick | Agregar onKeyDown y tabIndex |
| Missing alt text | Olvidar accessibility | Siempre incluir alt en imágenes |
| Div soup | No semantic HTML | Usar tags semánticos |

## Checklist de Validación

- [ ] Design tokens definidos (colors, spacing, typography)
- [ ] Componentes siguen atomic design
- [ ] Responsive en mobile, tablet, desktop
- [ ] Accessibility verificada (WAVE, aXe)
- [ ] Contrast ratio > 4.5:1
- [ ] Keyboard navigation funciona
- [ ] Alt text en todas las imágenes
- [ ] ARIA labels donde corresponde
- [ ] Loading/error states
- [ ] Focus states visibles

## Best Practices

1. **Design tokens** - Centralizar valores de diseño
2. **Atomic design** - Componentes pequeños y reutilizables
3. **Mobile-first** - Diseñar primero para móvil
4. **Semantic HTML** - Usar tags correctos
5. **Accessibility first** - No es opcional
6. **Consistent spacing** - Usar scale (8px, 16px, 24px...)
7. **Typography scale** - Sistema de tamaños coherente
8. **Color system** - Paleta limitada y consistente

---

**Última actualización:** Fase 3 - Skills Frontend Avanzado
**Mantenedor:** Sistema de Skills
**Siguiente:** Testing para asegurar calidad del frontend
