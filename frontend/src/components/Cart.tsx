import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Cart.module.css';

// Matches backend cartItemSchema (backend/models/Cart.js).
// `product` is the Product ObjectId reference; the rest are denormalized
// fields we need to render the row without a second lookup.
interface CartItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

const Cart: React.FC = () => {
  const { t } = useTranslation();

  // TODO: Replace with real cart state (e.g. context or backend)
  const [items, setItems] = useState<CartItem[]>([]);

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product !== productId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  return (
    <div className={styles.cartContainer}>
      <h2 className={styles.cartTitle}>{t('cart.title')}</h2>
      <div className={styles.cartContent}>
        {items.map((item) => (
          <div key={item.product} className={styles.cartItem}>
            <img src={item.image} alt={item.name} className={styles.itemImage} />
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemPrice}>${item.price.toFixed(2)}</div>
            </div>
            <div className={styles.quantityControls}>
              <button
                className={styles.quantityButton}
                onClick={() => updateQuantity(item.product, -1)}
              >
                -
              </button>
              <span className={styles.quantity}>{item.quantity}</span>
              <button
                className={styles.quantityButton}
                onClick={() => updateQuantity(item.product, 1)}
              >
                +
              </button>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => removeItem(item.product)}
            >
              {t('cart.remove')}
            </button>
          </div>
        ))}

        <div className={styles.cartSummary}>
          <div className={styles.summaryRow}>
            <span>{t('cart.subtotal')}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <hr className={styles.summaryDivider} />
          <div className={styles.totalRow}>
            <span>{t('cart.total')}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <button className={styles.checkoutButton}>
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
