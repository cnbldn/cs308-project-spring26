import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className={styles.pageFooter}>
      <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
      <span className={styles.footerDivider}>|</span>
      <span>{t('footer.privacyTerms')}</span>
    </footer>
  );
};

export default Footer;