import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Clock, CreditCard, Home, Package, ReceiptText, Truck } from 'lucide-react';
import DeliveryTracker from '../components/DeliveryTracker';
import styles from './OrderConfirmed.module.css';

const API_BASE = 'http://localhost:5000/api';

const STATUS_STEPS = [
  { label: 'Placed', icon: Check },
  { label: 'Preparing', icon: Package },
  { label: 'On the way', icon: Truck },
  { label: 'Delivered', icon: Home }
];

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
}).format(amount || 0);

const formatTime = (value) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: '2-digit',
    month: 'short'
  }).format(new Date(value));
};

const getLatestOrder = () => {
  try {
    return JSON.parse(localStorage.getItem('latestOrder') || 'null');
  } catch {
    return null;
  }
};

const getActiveStep = (status = '') => {
  if (status === 'Delivered') return 3;
  if (status === 'Out for delivery' || status === 'Arriving') return 2;
  if (status === 'Preparing') return 1;
  return 0;
};

const OrderConfirmed = ({ trackingOnly = false }) => {
  const { orderId } = useParams();
  const latestOrder = getLatestOrder();
  const resolvedOrderId = orderId || latestOrder?._id;
  const [order, setOrder] = useState(latestOrder);
  const [tracking, setTracking] = useState(latestOrder?.computedTracking || null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(resolvedOrderId));

  useEffect(() => {
    if (!resolvedOrderId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/orders/${resolvedOrderId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Order not found');
        if (isMounted) {
          setOrder(data);
          setTracking(data.computedTracking);
          localStorage.setItem('latestOrder', JSON.stringify(data));
          setError('');
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load this order.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [resolvedOrderId]);

  const handleTrackingUpdate = useCallback((nextTracking) => {
    setTracking(nextTracking);
  }, []);

  const orderItems = useMemo(() => order?.items || [], [order]);
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + Number(item.food?.price || 0) * Number(item.quantity || 1), 0),
    [orderItems]
  );
  const total = Number(order?.totalAmount || 0);
  const deliveryFee = total > subtotal ? total - subtotal : 50;
  const activeStep = getActiveStep(tracking?.status || order?.status);
  const orderNumber = resolvedOrderId ? resolvedOrderId.slice(-6).toUpperCase() : '--';
  const paymentLabel = order?.payment?.method
    ? `${order.payment.method}${order.payment.provider ? ` - ${order.payment.provider}` : ''}`
    : order?.paymentMethod || 'Payment';

  if (isLoading && !order) {
    return (
      <div className={`container ${styles.pageContainer}`}>
        <div className={styles.emptyState}>Loading your order...</div>
      </div>
    );
  }

  if (!resolvedOrderId || error) {
    return (
      <div className={`container ${styles.pageContainer}`}>
        <div className={styles.emptyState}>
          <h1>{error || 'No recent order found'}</h1>
          <p>Place an order to see live delivery tracking.</p>
          <Link to="/" className="btn btn-primary">Start Ordering</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.pageContainer}`}>
      <section className={styles.heroStatus}>
        <div className={styles.successIcon}>
          <Check size={36} />
        </div>
        <div>
          <span className={styles.eyebrow}>{trackingOnly ? 'Track order' : 'Order confirmed'}</span>
          <h1>{trackingOnly ? 'Track your delivery' : 'Your order is confirmed'}</h1>
          <p>Order #{orderNumber} arrives by {tracking ? formatTime(tracking.arrivingAt) : '--'}</p>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.orderPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Status</span>
              <h2>{tracking?.status || order?.status || 'Placed'}</h2>
            </div>
            <span className={styles.statusChip}>
              <Clock size={16} />
              {tracking?.etaMinutes ? `${tracking.etaMinutes} min` : 'On time'}
            </span>
          </div>

          <div className={styles.stepper}>
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className={`${styles.step} ${index <= activeStep ? styles.stepActive : ''}`}
                >
                  <span><Icon size={18} /></span>
                  <p>{step.label}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.detailList}>
            <div className={styles.detailBlock}>
              <Home size={20} />
              <div>
                <strong>Delivery Address</strong>
                <p>{order?.delivery?.address || 'Address not available'}</p>
                {order?.delivery?.instructions && <small>{order.delivery.instructions}</small>}
              </div>
            </div>

            <div className={styles.detailBlock}>
              <CreditCard size={20} />
              <div>
                <strong>Payment</strong>
                <p>{paymentLabel}</p>
                <small>{order?.payment?.status || 'Paid'}</small>
              </div>
            </div>
          </div>

          <div className={styles.receipt}>
            <div className={styles.receiptHeader}>
              <ReceiptText size={20} />
              <h3>Order Items</h3>
            </div>
            {orderItems.map((item, index) => (
              <div key={item.food?._id || index} className={styles.itemRow}>
                <span>{item.food?.name || 'Menu item'} x {item.quantity}</span>
                <strong>{formatCurrency(Number(item.food?.price || 0) * Number(item.quantity || 1))}</strong>
              </div>
            ))}

            <div className={styles.totalArea}>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery Fee</span>
                <strong>{formatCurrency(deliveryFee)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/purchase-history" className={`btn btn-outline ${styles.actionBtn}`}>
              View Orders
            </Link>
            <Link to="/" className={`btn btn-primary ${styles.actionBtn}`}>
              Order More
            </Link>
          </div>
        </section>

        <DeliveryTracker
          orderId={resolvedOrderId}
          initialTracking={tracking}
          onTrackingUpdate={handleTrackingUpdate}
        />
      </div>
    </div>
  );
};

export default OrderConfirmed;
