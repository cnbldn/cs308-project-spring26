import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Wishlist.module.css';

const API_BASE = 'http://localhost:5000/api';

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    basePrice?: number;
    discountedPrice?: number;
    discountRate?: number;
    discountStart?: string | null;
    discountEnd?: string | null;
    imageUrl?: string | null;
    stock: number;
    category: string;
  };
  addedAt: string;
}

const isLiveDiscount = (p: WishlistItem['product']): boolean => {
  if (!p.discountRate || p.discountRate <= 0) return false;
  const now = Date.now();
  if (p.discountStart && new Date(p.discountStart).getTime() > now) return false;
  if (p.discountEnd && new Date(p.discountEnd).getTime() < now) return false;
  return true;
};

const Wishlist: React.FC = () => {
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
      setError(err.response?.data?.message || 'Failed to load wishlist.');
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
      alert(err.response?.data?.message || 'Failed to remove item.');
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Wishlist</h1>
        <p className={styles.subtitle}>Items you've saved for later.</p>
      </header>

      {loading ? (
        <p className={styles.message}>Loading your wishlist...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9825;</div>
          <p>Your wishlist is empty.</p>
          <Link to="/shop" className={styles.shopLink}>Browse Products</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const onSale = isLiveDiscount(product);
            const basePrice = product.basePrice ?? product.price;
            const livePrice = onSale ? (product.discountedPrice ?? product.price) : product.price;
            const daysLeft = onSale && product.discountEnd
              ? Math.max(0, Math.ceil((new Date(product.discountEnd).getTime() - Date.now()) / 86400000))
              : null;

            return (
              <div key={item._id} className={styles.card}>
                {onSale && (
                  <span className={styles.discountBadge}>
                    -{Math.round(product.discountRate ?? 0)}%
                  </span>
                )}
                <Link to={`/product/${product._id}`} className={styles.imageLink}>
                  <img
                    src={product.imageUrl || 'https://placehold.co/300x300/161210/ffd700?text=No+Image'}
                    alt={product.name}
                    className={styles.image}
                  />
                </Link>
                <div className={styles.content}>
                  <p className={styles.category}>{product.category}</p>
                  <h3 className={styles.name}>{product.name}</h3>
                  <div className={styles.priceRow}>
                    {onSale && (
                      <span className={styles.originalPrice}>${basePrice.toFixed(2)}</span>
                    )}
                    <span className={styles.price}>${livePrice.toFixed(2)}</span>
                  </div>
                  {daysLeft !== null && (
                    <p className={styles.daysLeft}>
                      {daysLeft === 0 ? 'Ends today!' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                    </p>
                  )}
                  <p className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : ''}`}>
                    {product.stock === 0 ? 'Out of Stock' : `In Stock: ${product.stock}`}
                  </p>
                  <div className={styles.actions}>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemove(product._id)}
                    >
                      Remove
                    </button>
                    <Link to={`/product/${product._id}`} className={styles.viewButton}>
                      View Details
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
