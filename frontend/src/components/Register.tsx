import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Login.module.css';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    address?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = t('register.nameRequired');
    }

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

    if (!confirm) {
      newErrors.confirm = t('register.confirmRequired');
    } else if (confirm !== password) {
      newErrors.confirm = t('register.passwordMismatch');
    }

    if (!address.trim()) {
      newErrors.address = t('register.addressRequired');
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
    setApiError('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        homeAddress: address,
      });

      navigate('/login');
    } catch (err: any) {
      console.error('REGISTRATION ERROR:', err);

      if (err.response) {
        console.log('Backend Data:', err.response.data);
        console.log('Status Code:', err.response.status);
      }

      const message = err.response?.data?.message || t('register.registrationFailed');
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.loginTitle}>{t('register.title')}</h2>
        <p className={styles.subTitle}>{t('register.subtitle')}</p>

        {apiError && <div className={styles.error}>{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              {t('register.nameLabel')}
            </label>
            <input
              type="text"
              id="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('register.namePlaceholder')}
              required
            />
            {errors.name && <div className={styles.error}>{errors.name}</div>}
          </div>

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

          <div className={styles.formGroup}>
            <label htmlFor="confirm" className={styles.label}>
              {t('register.confirmLabel')}
            </label>
            <input
              type="password"
              id="confirm"
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
            />
            {errors.confirm && <div className={styles.error}>{errors.confirm}</div>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.label}>
              {t('register.addressLabel')}
            </label>
            <input
              type="text"
              id="address"
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('register.addressPlaceholder')}
              required
            />
            {errors.address && <div className={styles.error}>{errors.address}</div>}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? t('register.creatingAccount') : t('register.createAccount')}
          </button>
        </form>

        <div className={styles.links}>
          <span>{t('register.alreadyHaveAccount')}</span>
          <Link to="/login" className={styles.link}>
            {t('login.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
