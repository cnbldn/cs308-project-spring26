import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Wishlist.module.css';

const API_BASE = 'http://localhost:5000/api';

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    stock: number;
    category: string;
  };
  addedAt: string;
}

const Wishlist: React.FC = () => {
  const { t } = useTranslation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/wishlist/${user.id || user._id}`);
      setItems(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || t('wishlist.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await axios.delete(`${API_BASE}/wishlist/${user.id || user._id}/remove/${productId}`);
      setItems((prev) => prev.filter((item) => item.product._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.message || t('wishlist.removeFailed'));
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const translateCategory = (category: string) =>
    t(`shop.categoryLabels.${category}`, { defaultValue: category });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('wishlist.title')}</h1>
        <p className={styles.subtitle}>{t('wishlist.subtitle')}</p>
      </header>

      {loading ? (
        <p className={styles.message}>{t('wishlist.loading')}</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9825;</div>
          <p>{t('wishlist.empty')}</p>
          <Link to="/shop" className={styles.shopLink}>{t('wishlist.browseProducts')}</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div key={item._id} className={styles.card}>
                <Link to={`/product/${product._id}`} className={styles.imageLink}>
                  <img
                    src={product.imageUrl || 'https://placehold.co/300x300?text=No+Image'}
                    alt={product.name}
                    className={styles.image}
                  />
                </Link>
                <div className={styles.content}>
                  <p className={styles.category}>{translateCategory(product.category)}</p>
                  <h3 className={styles.name}>{product.name}</h3>
                  <p className={styles.price}>${product.price.toFixed(2)}</p>
                  <p className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : ''}`}>
                    {product.stock === 0 ? t('wishlist.outOfStock') : t('wishlist.inStock', { count: product.stock })}
                  </p>
                  <div className={styles.actions}>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemove(product._id)}
                    >
                      {t('wishlist.remove')}
                    </button>
                    <Link to={`/product/${product._id}`} className={styles.viewButton}>
                      {t('wishlist.viewDetails')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
