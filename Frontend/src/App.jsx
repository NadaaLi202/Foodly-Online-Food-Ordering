import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './components/food/AdminLayout';
import AdminRoute from './components/food/AdminRoute';
import AppLayout from './components/food/AppLayout';
import ProtectedRoute from './components/food/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import LoginPage from './Pages/auth/LoginPage';
import RegisterPage from './Pages/auth/RegisterPage';
import AdminDashboardPage from './Pages/admin/AdminDashboardPage';
import AdminOrdersPage from './Pages/admin/AdminOrdersPage';
import AdminProductsPage from './Pages/admin/AdminProductsPage';
import AdminUsersPage from './Pages/admin/AdminUsersPage';
import CartPage from './Pages/customer/CartPage';
import CheckoutPage from './Pages/customer/CheckoutPage';
import HomePage from './Pages/customer/HomePage';
import MenuPage from './Pages/customer/MenuPage';
import OrderTrackingPage from './Pages/customer/OrderTrackingPage';
import OrdersPage from './Pages/customer/OrdersPage';
import ProductDetailsPage from './Pages/customer/ProductDetailsPage';
import UnauthorizedPage from './Pages/UnauthorizedPage';

const AppRoutes = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  useEffect(() => {
    document.documentElement.lang = isArabic ? 'ar' : 'en';
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    localStorage.setItem('foodly_lang', isArabic ? 'ar' : 'en');
  }, [isArabic]);

  return (
    <>
      <ToastContainer position="top-center" rtl={isArabic} autoClose={2500} />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="menu/:id" element={<ProductDetailsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderTrackingPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
