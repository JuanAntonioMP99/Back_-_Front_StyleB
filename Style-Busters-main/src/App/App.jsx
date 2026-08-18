import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../Context/AuthContext";
import { CartProvider } from "../Context/CartContext";
import { ThemeProvider } from "../Context/ThemeContext";
import Layout from "../Layout/Layout";
import HomePage from "../Pages/HomePage";
import ProtectedRoute from "../Pages/ProtectedRoute";
import RouteFallback from "../Components/Common/RouteFallback/RouteFallback";

// HomePage y ProtectedRoute NO van en lazy:
// - HomePage es la ruta de aterrizaje y contiene el LCP (banner). Diferirla
//   añadiría un round-trip antes de poder pintar nada above-the-fold.
// - ProtectedRoute solo decide redirección; diferirlo retrasaría el guard.
// El resto de rutas se cargan bajo demanda: ninguna es alcanzable en el primer
// render y juntas son la mayor parte del JS de aplicación.
const CartPage = lazy(() => import("../Pages/CartPage"));
const CheckoutPage = lazy(() => import("../Pages/CheckoutPage"));
const ConfirmationPage = lazy(() => import("../Pages/ConfirmationPage"));
const Login = lazy(() => import("../Pages/Login"));
const ProductDetailsPage = lazy(() => import("../Pages/ProductDetailsPage"));
const Profile = lazy(() => import("../Pages/Profile"));
const Register = lazy(() => import("../Pages/Register"));
const SearchResults = lazy(() => import("../Pages/SearchResults"));

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Layout>
              {/* Un único Suspense por debajo del Layout: Header y Footer ya
                  están pintados cuando se descarga el chunk de la ruta, así que
                  el fallback solo ocupa el área de contenido. */}
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route
                    path="/product/:productId"
                    element={<ProductDetailsPage />}
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-confirmation"
                    element={<ConfirmationPage />}
                  />
                  <Route
                    path="*"
                    element={
                      <div data-testid="not-found">Ruta no encontrada</div>
                    }
                  />
                </Routes>
              </Suspense>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
