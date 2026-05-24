import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import Shop from './components/Shop';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import Account from './components/Account';
import OrderHistory from './components/OrderHistory';
import ManagerDashboard from './components/ManagerDashboard';
import SalesManagerDashboard from './components/SalesManagerDashboard';
import Wishlist from './components/Wishlist';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/sales-manager" element={<SalesManagerDashboard />} />
          </Route>
        </Routes>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
