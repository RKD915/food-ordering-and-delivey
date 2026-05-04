import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPinned, ReceiptText } from 'lucide-react';
import API_BASE from '../config/api';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
}).format(amount || 0);

const PurchaseHistory = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error('Error fetching orders', err));
  }, []);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 4rem', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase' }}>Order history</span>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '3rem' }}>My Orders</h1>
        </div>
        <Link to="/" className="btn btn-outline">Order More</Link>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ maxWidth: '560px', margin: '3rem auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>You have no orders yet</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Your live tracking and receipts will show up here.</p>
          <Link to="/" className="btn btn-primary">Start Ordering</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
          {orders.map((order) => (
            <article key={order._id} className="card" style={{ borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                <div>
                  <strong>Order #{order._id.slice(-6).toUpperCase()}</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{order.computedTracking?.status || order.status}</p>
                </div>
                <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{formatCurrency(order.totalAmount)}</span>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
                {order.items.map((item, idx) => (
                  <div key={item.food?._id || idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-dark)' }}>{item.food ? item.food.name : 'Menu item'} x {item.quantity}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.food ? formatCurrency(item.food.price * item.quantity) : ''}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  <Clock size={16} />
                  ETA {order.computedTracking?.etaMinutes || 0} min
                </span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <Link to={`/order-confirmed/${order._id}`} className="btn btn-outline" style={{ padding: '0.65rem 1rem' }}>
                    <ReceiptText size={17} />
                    Receipt
                  </Link>
                  <Link to={`/track-order/${order._id}`} className="btn btn-primary" style={{ padding: '0.65rem 1rem' }}>
                    <MapPinned size={17} />
                    Track Order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
