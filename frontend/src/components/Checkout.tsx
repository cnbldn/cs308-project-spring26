import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styles from './Checkout.module.css';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:5000/api';

const Checkout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [address, setAddress] = useState(user?.homeAddress || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  // --- Validation Helpers ---
  const validateForm = () => {
    if (!/^\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (address.length < 10) return 'Please enter a complete delivery address.';
    if (cardName.length < 3) return 'Please enter the full name on the card.';
    
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCard)) return 'Card number must be exactly 16 digits.';
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Expiry must be in MM/YY format.';
    if (!/^\d{3}$/.test(cvv)) return 'CVV must be exactly 3 digits.';
    
    return null;
  };

  // --- Auto-formatters ---
  const handleCardNumberChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').substring(0, 16);
    const parts = onlyNums.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').substring(0, 4);
    if (onlyNums.length >= 3) {
      setExpiry(`${onlyNums.slice(0, 2)}/${onlyNums.slice(2)}`);
    } else {
      setExpiry(onlyNums);
    }
  };

  const handleCvvChange = (val: string) => {
    setCvv(val.replace(/\D/g, '').substring(0, 3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Jira: CS308-FE-10 - Mock Banking Simulation
      setProcessingMessage('Connecting to secure mock banking entity...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingMessage('Verifying card details and availability of funds...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingMessage('Payment Confirmed by Mock Bank! Finalizing order...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await axios.post(`${API_BASE}/orders/checkout`, {
        customerId: user.id || user._id,
        deliveryAddress: address,
        billingEmail: email,
        mockPaymentReference: `MOCK-${cardNumber.slice(-4)}-${Date.now()}`
      });

      await refreshCart();
      setSuccess(response.data.invoice); // Store full invoice for Jira CS308-FE-11
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setError(err.response?.data?.message || t('checkout.failed'));
    } finally {
      setIsLoading(false);
      setProcessingMessage('');
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>{t('checkout.loginRequired')}</h2>
          <p>{t('checkout.loginPrompt')}</p>
          <button onClick={() => navigate('/login')} className={styles.button}>
            {t('checkout.loginButton')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>{t('checkout.confirmed')}</h2>
          <p className={styles.emailNote}>
            A PDF copy of your invoice has been sent to <strong>{success.billingEmail}</strong>.
          </p>
          
          <div className={styles.invoiceDisplay}>
            <div className={styles.invoiceHeader}>
              <div>
                <h3>INVOICE</h3>
                <p>#{success.invoiceNumber}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Date:</strong> {new Date(success.issuedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className={styles.invoiceSection}>
              <strong>Billed To:</strong>
              <p>{user?.name || 'Customer'}</p>
              <p>{success.billingAddress}</p>
            </div>

            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {success.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.invoiceTotal}>
              <div className={styles.totalRow}>
                <span>Subtotal </span>
                <span>${success.subtotal.toFixed(2)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total Amount </span>
                <span>${success.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <a 
              href={`${API_BASE}/orders/invoice/${success._id}/pdf`} 
              target="_blank" 
              rel="noreferrer"
              className={styles.downloadButton}
            >
              {t('checkout.downloadInvoice')}
            </a>
            <button onClick={() => navigate('/shop')} className={styles.shopButton}>
              {t('cart.continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('checkout.title')}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3>{t('checkout.deliveryBilling')}</h3>
          <div className={styles.field}>
            <label>{t('checkout.emailInvoice')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>{t('checkout.deliveryAddress')}</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
        </div>

        <div className={styles.section}>
          <h3>{t('checkout.payment')}</h3>
          <div className={styles.field}>
            <label>{t('checkout.nameOnCard')}</label>
            <input 
              type="text" 
              value={cardName} 
              onChange={e => setCardName(e.target.value.toUpperCase())} 
              placeholder="JOHN DOE"
              required 
            />
          </div>
          <div className={styles.field}>
            <label>{t('checkout.cardNumber')}</label>
            <input 
              type="text" 
              value={cardNumber} 
              onChange={e => handleCardNumberChange(e.target.value)} 
              placeholder="0000 0000 0000 0000" 
              required 
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>{t('checkout.expiry')}</label>
              <input 
                type="text" 
                value={expiry} 
                onChange={e => handleExpiryChange(e.target.value)} 
                placeholder="MM/YY" 
                required 
              />
            </div>
            <div className={styles.field}>
              <label>{t('checkout.cvv')}</label>
              <input 
                type="text" 
                value={cvv} 
                onChange={e => handleCvvChange(e.target.value)} 
                placeholder="123" 
                required 
              />
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        
        {processingMessage && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingModal}>
              <div className={styles.spinner}></div>
              <p>{processingMessage}</p>
            </div>
          </div>
        )}

        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? t('checkout.processing') : t('checkout.placeOrder')}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
