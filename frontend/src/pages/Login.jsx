import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE from '../config/api';
import styles from './Register.module.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.id]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful.');
        setError('');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 800);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Server error connecting to backend.');
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={`card ${styles.registerCard}`}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>FE</div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Login to order delicious food</p>
        </div>

        {error && <p style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#0f9d58', textAlign: 'center' }}>{success}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="rohan@test.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
            Login
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/register" className={styles.loginLink}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
