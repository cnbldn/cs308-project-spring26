import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <header className={styles.pageHeader}>
      <Link to="/" className={styles.brand}>{t('header.brand')}</Link>
      <div className={styles.linkGroup}>
        <Link to="/shop" className={styles.navLink}>{t('header.collections')}</Link>
        <Link to="/deals" className={styles.navLink}>{t('header.deals')}</Link>
        <Link to="/support" className={styles.navLink}>{t('header.support')}</Link>
        <Link to="/login" className={styles.navLink}>{t('login.signIn')}</Link>
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