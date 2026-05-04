import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Cart from './pages/Cart';
import OrderConfirmed from './pages/OrderConfirmed';
import PurchaseHistory from './pages/PurchaseHistory';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-confirmed" element={<OrderConfirmed />} />
          <Route path="/order-confirmed/:orderId" element={<OrderConfirmed />} />
          <Route path="/track-order/:orderId" element={<OrderConfirmed trackingOnly />} />
          <Route path="/purchase-history" element={<PurchaseHistory />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
