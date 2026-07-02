import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { CartProvider } from '../Context/CartContext';
import { AuthProvider } from '../Context/AuthContext';
import HomePage from '../Pages/HomePage';
import ProductDetailsPage from '../Pages/ProductDetailsPage';
import CartPage from '../Pages/CartPage';
import CheckoutPage from '../Pages/CheckoutPage';
import ConfirmationPage from '../Pages/ConfirmationPage';
import Layout from '../Layout/Layout';
import ProtectedRoute from '../Pages/ProtectedRoute';
import LogOn from '../Pages/LogOn';
import SearchResults from '../Pages/SearchResults';




function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route index element={<HomePage />} />
              <Route path='login' element={<LogOn/>}/>
              <Route path="product/:id" element={<ProductDetailsPage/>} />
              <Route path='search' element={<SearchResults/>}/>
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={ 
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>} />
              <Route path="order-confirmation" element={<ConfirmationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

