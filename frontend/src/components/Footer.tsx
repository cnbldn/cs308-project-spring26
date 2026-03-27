import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.pageFooter}>
      <span>© {new Date().getFullYear()} Game Vault</span>
      <span className={styles.footerDivider}>|</span>
      <span>Privacy · Terms</span>
    </footer>
  );
};

export default Footer;