import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, User, Utensils } from 'lucide-react';
import styles from './Navbar.module.css';

const getCartCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  } catch {
    return 0;
  }
};

const readSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(readSavedUser);
  const [cartCount, setCartCount] = useState(getCartCount);

  useEffect(() => {
    const refreshCartCount = () => setCartCount(getCartCount());
    window.addEventListener('storage', refreshCartCount);
    window.addEventListener('cart-updated', refreshCartCount);
    return () => {
      window.removeEventListener('storage', refreshCartCount);
      window.removeEventListener('cart-updated', refreshCartCount);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}><Utensils size={20} /></div>
          <span className="text-primary font-bold">FoodExpress</span>
        </Link>

        <div className={styles.navLinks}>
          <Link to="/" className={styles.navLink}>Home</Link>
          {user && <Link to="/purchase-history" className={styles.navLink}>My Orders</Link>}
          <Link to="/cart" className={styles.navLink}>
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </div>

        <div className={styles.actions}>
          {user ? (
            <>
              <div className={styles.userProfile}>
                <User size={18} />
                <span>{user.name}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutBtn} type="button">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`btn btn-outline ${styles.loginBtn}`}>Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
