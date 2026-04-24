import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Account.module.css';

const Account: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('account.title')}</h2>
        <p className={styles.subtitle}>{t('account.subtitle')}</p>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('account.title')}</h4>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.name')}</label>
            <div className={styles.value}>{user.name}</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.email')}</label>
            <div className={styles.value}>{user.email}</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.address')}</label>
            <div className={styles.value}>{user.homeAddress || '—'}</div>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          {t('account.logout')}
        </button>
      </div>
    </div>
  );
};

export default Account;
