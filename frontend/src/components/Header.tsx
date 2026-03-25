import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <header className={styles.pageHeader}>
      <div className={styles.brand}>{t('header.brand')}</div>
      <div className={styles.linkGroup}>
        <a href="#" className={styles.navLink}>{t('header.collections')}</a>
        <a href="#" className={styles.navLink}>{t('header.deals')}</a>
        <a href="#" className={styles.navLink}>{t('header.support')}</a>
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