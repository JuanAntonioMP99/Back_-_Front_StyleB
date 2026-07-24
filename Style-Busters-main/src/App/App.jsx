import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../Context/AuthContext";
import { CartProvider } from "../Context/CartContext";
import { ThemeProvider } from "../Context/ThemeContext";
import Layout from "../Layout/Layout";
import CartPage from "../Pages/CartPage";
import CheckoutPage from "../Pages/CheckoutPage";
import ConfirmationPage from "../Pages/ConfirmationPage";
import HomePage from "../Pages/HomePage";
import Login from "../Pages/Login";
import ProductDetailsPage from "../Pages/ProductDetailsPage";
import Profile from "../Pages/Profile";
import ProtectedRoute from "../Pages/ProtectedRoute";
import Register from "../Pages/Register";
import SearchResults from "../Pages/SearchResults";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Layout>
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
                  element={<div data-testid="not-found">Ruta no encontrada</div>}
                />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
