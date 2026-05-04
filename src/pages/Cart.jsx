import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  Home,
  Landmark,
  Loader2,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  Wallet
} from 'lucide-react';
import API_BASE from '../config/api';
import styles from './Cart.module.css';

const PAYMENT_METHODS = [
  {
    id: 'UPI',
    title: 'UPI',
    subtitle: 'PhonePe, Google Pay, Paytm, BHIM',
    icon: Smartphone,
    tone: 'violet'
  },
  {
    id: 'Card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, RuPay',
    icon: CreditCard,
    tone: 'blue'
  },
  {
    id: 'Wallet',
    title: 'Digital Wallet',
    subtitle: 'Paytm, Amazon Pay, Mobikwik',
    icon: Wallet,
    tone: 'green'
  },
  {
    id: 'NetBanking',
    title: 'Net Banking',
    subtitle: 'HDFC, SBI, ICICI, Axis and more',
    icon: Landmark,
    tone: 'slate'
  },
  {
    id: 'COD',
    title: 'Cash on Delivery',
    subtitle: 'Pay safely when your order arrives',
    icon: Banknote,
    tone: 'amber'
  }
];

const UPI_APPS = [
  { provider: 'Google Pay', merchantUpiId: 'foodexpress@okaxis' },
  { provider: 'PhonePe', merchantUpiId: 'foodexpress@ybl' },
  { provider: 'Paytm', merchantUpiId: 'foodexpress@paytm' },
  { provider: 'BHIM', merchantUpiId: 'foodexpress@upi' }
];

const BANK_OPTIONS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'];

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
}).format(amount || 0);

const formatCardNumber = (value) => value
  .replace(/\D/g, '')
  .slice(0, 19)
  .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const isValidCardNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

const isFutureExpiry = (value) => {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  return expiryDate > new Date();
};

const readSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const Cart = () => {
  const navigate = useNavigate();
  const savedUser = readSavedUser();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [delivery, setDelivery] = useState({
    name: savedUser?.name || '',
    phone: '',
    address: '',
    instructions: ''
  });
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    upiProvider: 'Google Pay',
    cardType: 'Credit Card',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    walletProvider: 'Paytm',
    walletMobile: '',
    bankName: 'HDFC Bank'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 1), 0),
    [cart]
  );
  const deliveryFee = cart.length > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  const persistCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (id, delta) => {
    const nextCart = cart.map((item) => (
      item._id === id ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) + delta) } : item
    ));
    persistCart(nextCart);
  };

  const removeItem = (id) => {
    persistCart(cart.filter((item) => item._id !== id));
  };

  const handleDeliveryChange = (field, value) => {
    setDelivery((current) => ({ ...current, [field]: value }));
  };

  const handlePaymentChange = (field, value) => {
    let nextValue = value;
    if (field === 'cardNumber') nextValue = formatCardNumber(value);
    if (field === 'expiry') nextValue = formatExpiry(value);
    if (field === 'cvv') nextValue = value.replace(/\D/g, '').slice(0, 4);
    if (field === 'walletMobile') nextValue = value.replace(/\D/g, '').slice(0, 10);
    setPaymentDetails((current) => ({ ...current, [field]: nextValue }));
  };

  const validateDelivery = () => {
    if (delivery.name.trim().length < 2) return 'Enter the delivery name.';
    if (!/^[6-9]\d{9}$/.test(delivery.phone.trim())) return 'Enter a valid 10 digit Indian mobile number.';
    if (delivery.address.trim().length < 8) return 'Enter a complete delivery address.';
    return '';
  };

  const buildPaymentPayload = () => {
    if (paymentMethod === 'UPI') {
      const upiId = paymentDetails.upiId.trim();
      const selectedUpiApp = UPI_APPS.find((app) => app.provider === paymentDetails.upiProvider) || UPI_APPS[0];
      if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        return { error: 'Enter your valid UPI ID, for example rohan@okaxis.' };
      }

      return {
        method: 'UPI',
        provider: paymentDetails.upiProvider,
        status: 'Paid',
        upiId,
        merchantUpiId: selectedUpiApp.merchantUpiId
      };
    }

    if (paymentMethod === 'Card') {
      const digits = paymentDetails.cardNumber.replace(/\D/g, '');
      if (paymentDetails.cardName.trim().length < 2) return { error: 'Enter the cardholder name.' };
      if (!isValidCardNumber(paymentDetails.cardNumber)) return { error: 'Enter a valid card number.' };
      if (!isFutureExpiry(paymentDetails.expiry)) return { error: 'Enter a valid future expiry date.' };
      if (!/^\d{3,4}$/.test(paymentDetails.cvv)) return { error: 'Enter a valid CVV.' };

      return {
        method: 'Card',
        provider: paymentDetails.cardType,
        status: 'Paid',
        cardType: paymentDetails.cardType,
        cardLast4: digits.slice(-4)
      };
    }

    if (paymentMethod === 'Wallet') {
      if (!/^[6-9]\d{9}$/.test(paymentDetails.walletMobile)) {
        return { error: 'Enter the mobile number linked to your wallet.' };
      }

      return {
        method: 'Wallet',
        provider: paymentDetails.walletProvider,
        status: 'Paid',
        walletMobile: paymentDetails.walletMobile
      };
    }

    if (paymentMethod === 'NetBanking') {
      if (!paymentDetails.bankName) return { error: 'Select your bank for net banking.' };

      return {
        method: 'NetBanking',
        provider: paymentDetails.bankName,
        status: 'Paid',
        bankName: paymentDetails.bankName
      };
    }

    return {
      method: 'COD',
      provider: 'Cash',
      status: 'Pending collection'
    };
  };

  const handleCheckout = async () => {
    setFormError('');
    if (cart.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    const deliveryError = validateDelivery();
    if (deliveryError) {
      setFormError(deliveryError);
      return;
    }

    const paymentPayload = buildPaymentPayload();
    if (paymentPayload.error) {
      setFormError(paymentPayload.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: savedUser?.id,
          items: cart,
          totalAmount: total,
          paymentMethod,
          payment: paymentPayload,
          delivery: {
            ...delivery,
            name: delivery.name.trim(),
            phone: delivery.phone.trim(),
            address: delivery.address.trim(),
            instructions: delivery.instructions.trim()
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed. Try again.');
      }

      localStorage.removeItem('cart');
      localStorage.setItem('latestOrder', JSON.stringify(data.order));
      window.dispatchEvent(new Event('cart-updated'));
      navigate(`/order-confirmed/${data.orderId}`);
    } catch (err) {
      setFormError(err.message || 'Error confirming order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethod);

  const renderPaymentFields = () => {
    if (paymentMethod === 'UPI') {
      const selectedUpiApp = UPI_APPS.find((app) => app.provider === paymentDetails.upiProvider) || UPI_APPS[0];
      return (
        <div className={styles.paymentFields}>
          <div className={styles.providerTabs}>
            {UPI_APPS.map((app) => (
              <button
                key={app.provider}
                type="button"
                className={`${styles.providerBtn} ${paymentDetails.upiProvider === app.provider ? styles.providerActive : ''}`}
                onClick={() => handlePaymentChange('upiProvider', app.provider)}
              >
                {app.provider}
              </button>
            ))}
          </div>
          <div className={styles.merchantUpiCard}>
            <div>
              <small>{selectedUpiApp.provider} UPI ID</small>
              <strong>{selectedUpiApp.merchantUpiId}</strong>
            </div>
            <span>FoodExpress</span>
          </div>
          <label className={styles.inputGroup}>
            <span>Your UPI ID</span>
            <input
              value={paymentDetails.upiId}
              onChange={(event) => handlePaymentChange('upiId', event.target.value)}
              placeholder="rohan@okaxis"
              autoComplete="off"
            />
          </label>
        </div>
      );
    }

    if (paymentMethod === 'Card') {
      return (
        <div className={styles.paymentFields}>
          <div className={styles.providerTabs}>
            {['Credit Card', 'Debit Card'].map((cardType) => (
              <button
                key={cardType}
                type="button"
                className={`${styles.providerBtn} ${paymentDetails.cardType === cardType ? styles.providerActive : ''}`}
                onClick={() => handlePaymentChange('cardType', cardType)}
              >
                {cardType}
              </button>
            ))}
          </div>
          <label className={styles.inputGroup}>
            <span>Cardholder Name</span>
            <input
              value={paymentDetails.cardName}
              onChange={(event) => handlePaymentChange('cardName', event.target.value)}
              placeholder="Rohan Kumar"
              autoComplete="cc-name"
            />
          </label>
          <label className={styles.inputGroup}>
            <span>Card Number</span>
            <input
              value={paymentDetails.cardNumber}
              onChange={(event) => handlePaymentChange('cardNumber', event.target.value)}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </label>
          <div className={styles.fieldGrid}>
            <label className={styles.inputGroup}>
              <span>Expiry</span>
              <input
                value={paymentDetails.expiry}
                onChange={(event) => handlePaymentChange('expiry', event.target.value)}
                placeholder="08/29"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
            </label>
            <label className={styles.inputGroup}>
              <span>CVV</span>
              <input
                value={paymentDetails.cvv}
                onChange={(event) => handlePaymentChange('cvv', event.target.value)}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </label>
          </div>
          <p className={styles.paymentHint}>Card payment continues through bank authorization after details are verified.</p>
        </div>
      );
    }

    if (paymentMethod === 'Wallet') {
      return (
        <div className={styles.paymentFields}>
          <div className={styles.providerTabs}>
            {['Paytm', 'Amazon Pay', 'Mobikwik'].map((provider) => (
              <button
                key={provider}
                type="button"
                className={`${styles.providerBtn} ${paymentDetails.walletProvider === provider ? styles.providerActive : ''}`}
                onClick={() => handlePaymentChange('walletProvider', provider)}
              >
                {provider}
              </button>
            ))}
          </div>
          <label className={styles.inputGroup}>
            <span>Wallet Mobile Number</span>
            <input
              value={paymentDetails.walletMobile}
              onChange={(event) => handlePaymentChange('walletMobile', event.target.value)}
              placeholder="9876543210"
              inputMode="numeric"
              autoComplete="tel"
            />
          </label>
        </div>
      );
    }

    if (paymentMethod === 'NetBanking') {
      return (
        <div className={styles.paymentFields}>
          <div className={styles.bankGrid}>
            {BANK_OPTIONS.map((bankName) => (
              <button
                key={bankName}
                type="button"
                className={`${styles.bankBtn} ${paymentDetails.bankName === bankName ? styles.bankActive : ''}`}
                onClick={() => handlePaymentChange('bankName', bankName)}
              >
                {bankName}
              </button>
            ))}
          </div>
          <p className={styles.paymentHint}>Net banking continues to your selected bank authorization page.</p>
        </div>
      );
    }

    return (
      <div className={styles.codNotice}>
        <Banknote size={20} />
        <span>Cash will be collected by the delivery partner at your doorstep.</span>
      </div>
    );
  };

  return (
    <div className={`container ${styles.cartPage}`}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Fast checkout</span>
          <h1>Checkout</h1>
        </div>
        <Link to="/" className={`btn btn-outline ${styles.headerAction}`}>
          Add more items
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add your favourites from the menu and come back to checkout.</p>
          <Link to="/" className="btn btn-primary">Browse Menu</Link>
        </div>
      ) : (
        <div className={styles.checkoutGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.panel}>
              <div className={styles.panelTitleRow}>
                <div>
                  <span className={styles.sectionNumber}>1</span>
                  <h2>Delivery Details</h2>
                </div>
                <ShieldCheck size={22} />
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.inputGroup}>
                  <span>Full Name</span>
                  <div className={styles.inputWithIcon}>
                    <User size={18} />
                    <input
                      value={delivery.name}
                      onChange={(event) => handleDeliveryChange('name', event.target.value)}
                      placeholder="Rohan Kumar"
                      autoComplete="name"
                    />
                  </div>
                </label>

                <label className={styles.inputGroup}>
                  <span>Phone Number</span>
                  <div className={styles.inputWithIcon}>
                    <Phone size={18} />
                    <input
                      value={delivery.phone}
                      onChange={(event) => handleDeliveryChange('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </label>
              </div>

              <label className={styles.inputGroup}>
                <span>Delivery Address</span>
                <div className={styles.inputWithIcon}>
                  <Home size={18} />
                  <input
                    value={delivery.address}
                    onChange={(event) => handleDeliveryChange('address', event.target.value)}
                    placeholder="Flat, street, landmark, city"
                    autoComplete="street-address"
                  />
                </div>
              </label>

              <label className={styles.inputGroup}>
                <span>Delivery Instructions</span>
                <textarea
                  value={delivery.instructions}
                  onChange={(event) => handleDeliveryChange('instructions', event.target.value)}
                  placeholder="Optional: gate code, floor, or drop-off note"
                  rows={3}
                />
              </label>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelTitleRow}>
                <div>
                  <span className={styles.sectionNumber}>2</span>
                  <h2>Payment Method</h2>
                </div>
                <span className={styles.secureBadge}>Secure</span>
              </div>

              <div className={styles.paymentGrid}>
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      className={`${styles.paymentCard} ${isActive ? styles.paymentActive : ''}`}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setFormError('');
                      }}
                    >
                      <span className={`${styles.methodIcon} ${styles[method.tone]}`}>
                        <Icon size={24} />
                      </span>
                      <span className={styles.methodCopy}>
                        <strong>{method.title}</strong>
                        <small>{method.subtitle}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.selectedPayment}>
                <div className={styles.selectedHeader}>
                  <span>{selectedMethod?.title}</span>
                  <small>{formatCurrency(total)}</small>
                </div>
                {renderPaymentFields()}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelTitleRow}>
                <div>
                  <span className={styles.sectionNumber}>3</span>
                  <h2>Order Items</h2>
                </div>
                <span className={styles.itemCount}>{cart.length} items</span>
              </div>

              <div className={styles.cartItems}>
                {cart.map((item) => {
                  const imageSrc = item.imageUrl?.startsWith('http') ? item.imageUrl : item.imageUrl;
                  return (
                    <article key={item._id} className={styles.cartItem}>
                      <img
                        src={imageSrc || '/favicon.svg'}
                        alt={item.name}
                        className={styles.itemImage}
                      />

                      <div className={styles.itemDetails}>
                        <div className={styles.itemHeader}>
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </div>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => removeItem(item._id)}
                            aria-label={`Remove ${item.name}`}
                            type="button"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className={styles.itemFooter}>
                          <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => updateQuantity(item._id, -1)} aria-label={`Decrease ${item.name}`}>
                              <Minus size={15} />
                            </button>
                            <strong>{item.quantity}</strong>
                            <button type="button" onClick={() => updateQuantity(item._id, 1)} aria-label={`Increase ${item.name}`}>
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className={styles.summaryPanel}>
            <h2>Order Summary</h2>
            <div className={styles.summaryItems}>
              {cart.map((item) => (
                <div key={item._id} className={styles.summaryItem}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryTotals}>
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

            {formError && <div className={styles.errorBox}>{formError}</div>}

            <button
              type="button"
              className={`btn btn-primary ${styles.checkoutBtn}`}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  Processing
                </>
              ) : (
                `Place Order - ${formatCurrency(total)}`
              )}
            </button>

            <p className={styles.securityNote}>
              <ShieldCheck size={16} />
              Payment details are validated locally and only safe metadata is saved.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
