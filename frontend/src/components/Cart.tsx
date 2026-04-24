import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Cart.module.css';

const API_BASE = 'http://localhost:5000/api';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
    image?: string;
  };
  quantity: number;
  price: number;
}

// Helper to handle guest session IDs (Fulfills Req #4)
const getSessionId = () => {
  return localStorage.getItem('sessionId');
};

const Cart: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id;
    const sessionId = getSessionId();

    // The backend GET route now handles both customerId and sessionId in the URL
    const cartId = customerId || sessionId;

    if (!cartId) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/cart/${cartId}`);
      setItems(res.data.items || []);
      setTotal(res.data.cartTotal || 0);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (productId: string) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id;
    const sessionId = getSessionId();
    const cartId = customerId || sessionId;

    if (!cartId) return;

    try {
      await axios.delete(`${API_BASE}/cart/${cartId}/${productId}`);
      await fetchCart();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const updateQuantity = async (
    productId: string,
    delta: number,
    currentQuantity: number
  ) => {
    if (delta < 0 && currentQuantity + delta <= 0) {
      await removeItem(productId);
      return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id || null;
    const sessionId = !customerId ? getSessionId() : null;

    try {
      await axios.post(`${API_BASE}/cart/add`, {
        productId,
        quantity: delta,
        customerId,
        sessionId,
      });
      await fetchCart();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (loading) return <div className={styles.cartContainer}><p>{t('cart.loading')}</p></div>;

  if (items.length === 0) {
    return (
      <div className={styles.cartContainer}>
        <h2 className={styles.cartTitle}>{t('cart.title')}</h2>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#128722;</div>
          <p className={styles.emptyText}>{t('cart.empty')}</p>
          <Link to="/shop" className={styles.shopLink}>
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  const PLACEHOLDER_IMAGE = 'https://placehold.co/100x100?text=Product';

  return (
    <div className={styles.cartContainer}>
      <h2 className={styles.cartTitle}>{t('cart.title')}</h2>
      <div className={styles.cartContent}>
        {items.map((item) => {
          if (!item?.product) return null;
          return (
            <div key={item.product._id} className={styles.cartItem}>
              <img 
                src={item.product.imageUrl || item.product.image || PLACEHOLDER_IMAGE} 
                alt={item.product.name} 
                className={styles.itemImage} 
              />
              <div className={styles.itemDetails}>
                <div className={styles.itemName}>{item.product.name}</div>
                <div className={styles.itemPrice}>${item.product.price.toFixed(2)}</div>
              </div>
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityButton}
                  onClick={() =>
                    updateQuantity(item.product._id, -1, item.quantity)
                  }
                >
                  -
                </button>
                <span className={styles.quantity}>{item.quantity}</span>
                <button
                  className={styles.quantityButton}
                  onClick={() =>
                    updateQuantity(item.product._id, 1, item.quantity)
                  }
                >
                  +
                </button>
              </div>
              <button
                className={styles.removeButton}
                onClick={() => removeItem(item.product._id)}
              >
                {t('cart.remove')}
              </button>
            </div>
          );
        })}

        <div className={styles.cartSummary}>
          <div className={styles.summaryRow}>
            <span>{t('cart.subtotal')}</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <hr className={styles.summaryDivider} />
          <div className={styles.totalRow}>
            <span>{t('cart.total')}</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link to="/checkout" className={styles.checkoutButton} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
