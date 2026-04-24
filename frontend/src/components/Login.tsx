import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('login.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('login.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('login.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('login.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        sessionId,
      });

      if (response.data.user) {
        // Save user info and token (if any) to localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        console.log('Login successful:', response.data.user);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      setErrors({
        general: error.response?.data?.message || t('login.genericError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.loginTitle}>{t('login.welcomeBack')}</h2>
        <p className={styles.subTitle}>{t('login.subtitle')}</p>
        
        {errors.general && (
          <div className={styles.error} style={{ marginBottom: '1rem', color: '#dc2626', textAlign: 'center' }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              {t('login.emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              {t('login.passwordLabel')}
            </label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
            />
            {errors.password && <div className={styles.error}>{errors.password}</div>}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>{t('login.forgotPassword')}</Link>
          <span className={styles.dotSeparator}>•</span>
          <Link to="/register" className={styles.link}>{t('login.createAccount')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
