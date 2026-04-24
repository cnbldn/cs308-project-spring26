import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <header className={styles.pageHeader}>
      <Link to="/" className={styles.brand}>{t('header.brand')}</Link>
      <div className={styles.linkGroup}>
        <Link to="/shop" className={styles.navLink}>{t('header.collections')}</Link>
        <Link to="/deals" className={styles.navLink}>{t('header.deals')}</Link>
        <Link to="/support" className={styles.navLink}>{t('header.support')}</Link>
        <Link to="/cart" className={styles.navLink}>{t('cart.title')}</Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Note: You may want to add a translation key for 'Orders' here eventually */}
            <Link to="/orders" className={styles.navLink}>Orders</Link>
            
            <span className={styles.userGreeting}>
              {t('header.hello')}, {user.name || user.email.split('@')[0]}
            </span>
            
            <Link to="/account" className={styles.signInButton}>
              {t('account.myAccount')}
            </Link>
          </div>
        ) : (
          <Link to="/login" className={styles.signInButton}>{t('login.signIn')}</Link>
        )}
      </div>
      <div className={styles.languageSwitcher} data-lang={i18n.language}>
        <button
          className={`${styles.langButton} ${i18n.language === 'en' ? styles.active : ''}`}
          onClick={() => i18n.changeLanguage('en')}
        >
          EN
        </button>
        <button
          className={`${styles.langButton} ${i18n.language === 'tr' ? styles.active : ''}`}
          onClick={() => i18n.changeLanguage('tr')}
        >
          TR
        </button>
      </div>
    </header>
  );
};

export default Header;
