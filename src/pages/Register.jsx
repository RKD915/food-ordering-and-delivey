import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful.');
        setError('');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError(data.message || 'Registration failed');
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Register to start ordering delicious food</p>
        </div>

        {error && <p style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#0f9d58', textAlign: 'center' }}>{success}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" placeholder="Rohan Kumar" value={formData.name} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="rohan@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
            Register
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.loginLink}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
