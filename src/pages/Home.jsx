import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import heroImage from '../assets/hero.png';
import styles from './Home.module.css';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
}).format(amount || 0);

const Home = () => {
  const [foods, setFoods] = useState([]);
  const [activeTab, setActiveTab] = useState('Indian');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/foods')
      .then((res) => res.json())
      .then((data) => setFoods(data))
      .catch((err) => console.error('Failed to fetch foods', err));
  }, []);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addToCart = (food) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item._id === food._id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...food, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    setToastMessage(`${food.name} added to cart`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className={styles.home}>
      <section className={styles.hero} style={{ backgroundImage: `url(${heroImage})` }}>
        <div className={styles.heroOverlay}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.eyebrow}>Fresh food, live delivery</span>
          <h1 className={styles.heroTitle}>
            Order your favorite food online
          </h1>
          <p className={styles.heroSubtitle}>
            Fast checkout, secure payments, and live driver tracking from kitchen to doorstep.
          </p>
          <div className={styles.heroActions}>
            <button className={`btn btn-primary ${styles.heroBtn}`} onClick={scrollToMenu} type="button">
              Order Now <ArrowRight size={18} />
            </button>
            <button className={`btn btn-outline ${styles.heroBtnWhite}`} onClick={scrollToMenu} type="button">
              View Menu
            </button>
          </div>
        </div>
      </section>

      <section className={styles.menu} id="menu">
        <div className={`container ${styles.menuContainer}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Explore menu</span>
            <h2>Popular dishes</h2>
          </div>

          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'Indian' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('Indian')}
              type="button"
            >
              Indian Food
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'Western' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('Western')}
              type="button"
            >
              Western Food
            </button>
          </div>

          <div className={styles.menuGrid}>
            {foods.length > 0 ? foods.filter((food) => food.region === activeTab).map((food) => (
              <article key={food._id} className={styles.foodCard}>
                <img src={food.imageUrl} alt={food.name} className={styles.foodImage} />
                <div className={styles.foodInfo}>
                  <div className={styles.foodHeader}>
                    <h3 className={styles.foodName}>{food.name}</h3>
                    <span className={styles.foodCategory}>{food.category}</span>
                  </div>
                  <p className={styles.foodDesc}>{food.description}</p>
                  <div className={styles.foodFooter}>
                    <span className={styles.foodPrice}>{formatCurrency(food.price)}</span>
                    <button
                      className={`btn btn-primary ${styles.addToCartBtn}`}
                      onClick={() => addToCart(food)}
                      type="button"
                    >
                      <Plus size={17} />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className={styles.loadingMenu}>Loading menu...</div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={`container ${styles.featuresContainer}`}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.speedIcon}`}>
              <Truck size={32} />
            </div>
            <h3>Fast Delivery</h3>
            <p>Live ETA and driver location after every order.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.secureIcon}`}>
              <ShieldCheck size={32} />
            </div>
            <h3>Secure Payments</h3>
            <p>UPI, card, wallet, and cash flows with smart validation.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.clockIcon}`}>
              <Clock size={32} />
            </div>
            <h3>Fresh Timing</h3>
            <p>Orders move from kitchen to doorstep with clear status updates.</p>
          </div>
        </div>
      </section>

      {toastMessage && (
        <div className={styles.toast}>
          <span>{toastMessage}</span>
          <button onClick={() => { window.location.href = '/cart'; }} type="button">
            <ShoppingCart size={17} />
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
