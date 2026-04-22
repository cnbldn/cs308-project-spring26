import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styles from './Checkout.module.css';

const API_BASE = 'http://localhost:5000/api';

const Checkout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [address, setAddress] = useState(user?.homeAddress || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ orderId: string; invoiceId: string } | null>(null);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>{t('login.signIn')} Required</h2>
          <p>Please log in to complete your purchase.</p>
          <button onClick={() => navigate('/login')} className={styles.button}>Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/orders/checkout`, {
        customerId: user.id || user._id,
        deliveryAddress: address,
        billingEmail: email,
        mockPaymentReference: `MOCK-${cardNumber.slice(-4)}-${Date.now()}`
      });

      setSuccess({
        orderId: response.data.orderId,
        invoiceId: response.data.invoiceId
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2>Order Confirmed!</h2>
          <p>Order ID: {success.orderId.slice(-8)}</p>
          <div className={styles.actions}>
            <a 
              href={`${API_BASE}/orders/invoice/${success.invoiceId}/pdf`} 
              target="_blank" 
              rel="noreferrer"
              className={styles.downloadButton}
            >
              Download Invoice (PDF)
            </a>
            <button onClick={() => navigate('/shop')} className={styles.shopButton}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Checkout</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3>Delivery & Billing</h3>
          <div className={styles.field}>
            <label>Email for Invoice</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Delivery Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
        </div>

        <div className={styles.section}>
          <h3>Payment (Mock)</h3>
          <p className={styles.hint}>Requirement #14: Card verification is out of scope.</p>
          <div className={styles.field}>
            <label>Name on Card</label>
            <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Card Number</label>
            <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Expiry</label>
              <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" required />
            </div>
            <div className={styles.field}>
              <label>CVV</label>
              <input type="text" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" required />
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
