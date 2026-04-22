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

function App() {
  return (
    <BrowserRouter>
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
          <Route path="/checkout" element={<div style={{ padding: '100px', textAlign: 'center' }}><h1>Checkout Page</h1><p>Welcome! Only logged-in users can see this.</p></div>} />
          <Route path="/profile" element={<div style={{ padding: '100px', textAlign: 'center' }}><h1>Profile Page</h1><p>Welcome! This is your private profile.</p></div>} />
        </Route>
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
