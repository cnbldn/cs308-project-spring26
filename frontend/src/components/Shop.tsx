import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styles from './Shop.module.css';

const API_BASE = 'http://localhost:5000/api';

// Backend Product shape (from backend/models/Product.js)
//   _id, name, description, price, stock, category, imageUrl
// The current GET /api/products mock route still returns the old shape
// (id / image), so we accept both and normalize.
interface RawProduct {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

const PLACEHOLDER_IMAGE =
  'https://placehold.co/300x300/161210/ffd700?text=No+Image';

const normalize = (raw: RawProduct): Product => ({
  id: raw._id ?? raw.id ?? '',
  name: raw.name,
  description: raw.description ?? '',
  category: raw.category,
  price: raw.price,
  stock: raw.stock,
  image: raw.imageUrl || raw.image || PLACEHOLDER_IMAGE,
});

const Shop: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get<RawProduct[]>(`${API_BASE}/products`);
        setProducts(res.data.map(normalize));
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(t('shop.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [t]);

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    setFeedback(null);

    // Pull customerId from the logged-in user (Header.tsx already stores
    // the user object in localStorage on login).
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id || null;

    try {
      await axios.post(`${API_BASE}/cart/add`, {
        productId: product.id,
        quantity: 1,
        customerId,
      });
      setFeedback({
        id: product.id,
        type: 'success',
        message: t('shop.added'),
      });
    } catch (err: any) {
      console.error('Add to cart failed:', err);
      const message =
        err.response?.data?.message || t('shop.addToCartFailed');
      setFeedback({ id: product.id, type: 'error', message });
    } finally {
      setAddingId(null);
      // Auto-clear feedback after 2.5s
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className={styles.shopContainer}>
        <h2 className={styles.shopTitle}>{t('shop.title')}</h2>
        <p className={styles.shopSubtitle}>{t('shop.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.shopContainer}>
        <h2 className={styles.shopTitle}>{t('shop.title')}</h2>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.shopContainer}>
      <h2 className={styles.shopTitle}>{t('shop.title')}</h2>
      <p className={styles.shopSubtitle}>{t('shop.subtitle')}</p>

      <div className={styles.productGrid}>
        {products.map((product) => {
          const outOfStock = product.stock === 0;
          const isAdding = addingId === product.id;
          const productFeedback =
            feedback && feedback.id === product.id ? feedback : null;

          return (
            <div key={product.id} className={styles.productCard}>
              <img
                src={product.image}
                alt={product.name}
                className={styles.productImage}
              />
              <p className={styles.productCategory}>{product.category}</p>
              <h3 className={styles.productName}>{product.name}</h3>
              <p
                className={`${styles.productStock} ${
                  outOfStock ? styles.outOfStock : ''
                }`}
              >
                {outOfStock
                  ? t('shop.outOfStock')
                  : t('shop.inStock', { count: product.stock })}
              </p>
              <div className={styles.productFooter}>
                <span className={styles.productPrice}>
                  ${product.price.toFixed(2)}
                </span>
                <button
                  className={styles.addButton}
                  disabled={outOfStock || isAdding}
                  onClick={() => handleAddToCart(product)}
                >
                  {isAdding ? t('shop.adding') : t('shop.addToCart')}
                </button>
              </div>
              {productFeedback && (
                <p
                  className={
                    productFeedback.type === 'success'
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
                  {productFeedback.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
