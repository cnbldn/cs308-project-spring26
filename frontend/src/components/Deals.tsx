import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './Shop.module.css';
import ProductImageHover from './ProductImageHover';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:5000/api';
const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/161210/ffd700?text=No+Image';

interface RawProduct {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  basePrice?: number;
  discountedPrice?: number;
  discountRate?: number;
  discountStart?: string | null;
  discountEnd?: string | null;
  stock: number;
  imageUrl?: string | null;
  image?: string;
  averageRating?: number;
  totalRatings?: number;
}

interface Deal {
  id: string;
  name: string;
  category: string;
  price: number;
  basePrice: number;
  discountRate: number;
  discountEnd: string | null;
  stock: number;
  image: string;
  averageRating: number;
  totalRatings: number;
}

const normalize = (raw: RawProduct): Deal => ({
  id: raw._id ?? raw.id ?? '',
  name: raw.name,
  category: raw.category,
  price: raw.discountedPrice ?? raw.price,
  basePrice: raw.basePrice ?? raw.price,
  discountRate: raw.discountRate ?? 0,
  discountEnd: raw.discountEnd ?? null,
  stock: raw.stock,
  image: raw.imageUrl || raw.image || PLACEHOLDER_IMAGE,
  averageRating: raw.averageRating ?? 0,
  totalRatings: raw.totalRatings ?? 0,
});

const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

const Deals: React.FC = () => {
  const { t } = useTranslation();
  const { refreshCart } = useCart();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('discount_desc');

  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const translateCategory = (category: string) =>
    t(`shop.categoryLabels.${category}`, { defaultValue: category });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dealsRes, categoriesRes] = await Promise.all([
          axios.get<RawProduct[]>(`${API_BASE}/products/deals`),
          axios
            .get<string[]>(`${API_BASE}/products/deals/categories`)
            .catch(() => ({ data: [] as string[] })),
        ]);
        setDeals(dealsRes.data.map(normalize));
        setCategories(categoriesRes.data);
        setError('');
      } catch (err) {
        console.error('Failed to load deals:', err);
        setError(t('shop.loadError') || 'Failed to load deals');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [t]);

  const handleAddToCart = async (product: Deal) => {
    setAddingId(product.id);
    setFeedback(null);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const customerId = user?.id || user?._id || null;
    const sessionId = !customerId ? getSessionId() : null;

    try {
      await axios.post(`${API_BASE}/cart/add`, {
        productId: product.id,
        quantity: 1,
        customerId,
        sessionId,
      });
      await refreshCart();
      setFeedback({ id: product.id, type: 'success', message: t('shop.added') || 'Added to cart!' });
    } catch (err: any) {
      const message = err.response?.data?.message || t('shop.addToCartFailed') || 'Failed to add to cart';
      setFeedback({ id: product.id, type: 'error', message });
    } finally {
      setAddingId(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      setFeedback({ id: productId, type: 'error', message: 'Please login to use wishlist.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setWishlistLoadingId(productId);
    try {
      await axios.post(`${API_BASE}/wishlist/${user.id || user._id}/add`, { productId });
      setFeedback({ id: productId, type: 'success', message: 'Added to wishlist!' });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add to wishlist.';
      setFeedback({ id: productId, type: 'error', message });
    } finally {
      setWishlistLoadingId(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const visible = deals
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .sort((a, b) => {
      if (sort === 'discount_desc') return b.discountRate - a.discountRate;
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'ending_soon') {
        const aEnd = a.discountEnd ? new Date(a.discountEnd).getTime() : Infinity;
        const bEnd = b.discountEnd ? new Date(b.discountEnd).getTime() : Infinity;
        return aEnd - bEnd;
      }
      return 0;
    });

  const activeCategories = categories.length > 0
    ? categories
    : Array.from(new Set(deals.map((d) => d.category)));

  return (
    <div className={styles.shopContainer}>
      <h2 className={styles.shopTitle}>{t('header.deals') || 'Deals'}</h2>
      <p className={styles.shopSubtitle}>
        {t('deals.subtitle', { defaultValue: 'Limited-time discounts on selected titles.' })}
      </p>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <h4 className={styles.sidebarTitle}>{t('shop.categories') || 'Categories'}</h4>
          <ul className={styles.categoryList}>
            <li className={styles.categoryItem}>
              <button
                className={`${styles.categoryButton} ${selectedCategory === '' ? styles.activeCategory : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                {t('deals.allDeals', { defaultValue: 'All Deals' })}
              </button>
            </li>
            {[...activeCategories].sort().map((cat) => (
              <li key={cat} className={styles.categoryItem}>
                <button
                  className={`${styles.categoryButton} ${selectedCategory === cat ? styles.activeCategory : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {translateCategory(cat)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.contentArea}>
          <div className={styles.toolbar}>
            <select
              className={styles.selectInput}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="discount_desc">
                {t('deals.sortDiscount', { defaultValue: 'Biggest Discount' })}
              </option>
              <option value="ending_soon">
                {t('deals.sortEndingSoon', { defaultValue: 'Ending Soon' })}
              </option>
              <option value="price_asc">{t('shop.sortPriceAsc') || 'Price: Low to High'}</option>
              <option value="price_desc">{t('shop.sortPriceDesc') || 'Price: High to Low'}</option>
            </select>
          </div>

          {loading ? (
            <p className={styles.shopSubtitle}>{t('shop.loading') || 'Loading...'}</p>
          ) : error ? (
            <p className={styles.errorMessage}>{error}</p>
          ) : visible.length === 0 ? (
            <p className={styles.shopSubtitle}>
              {t('deals.empty', { defaultValue: 'No deals are running right now. Check back soon!' })}
            </p>
          ) : (
            <div className={styles.productGrid}>
              {visible.map((product) => {
                const outOfStock = product.stock === 0;
                const isAdding = addingId === product.id;
                const productFeedback = feedback && feedback.id === product.id ? feedback : null;
                const rounded = Math.round(product.averageRating);
                const daysLeft = product.discountEnd
                  ? Math.max(0, Math.ceil((new Date(product.discountEnd).getTime() - Date.now()) / 86400000))
                  : null;

                return (
                  <div key={product.id} className={styles.productCard} style={{ position: 'relative' }}>
                    <span
                      aria-label={`${Math.round(product.discountRate)} percent off`}
                      style={{
                        position: 'absolute',
                        top: '0.6rem',
                        left: '0.6rem',
                        zIndex: 2,
                        background: '#c0392b',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      -{Math.round(product.discountRate)}%
                    </span>
                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                      <ProductImageHover src={product.image} alt={product.name} />
                      <p className={styles.productCategory}>{translateCategory(product.category)}</p>
                      <h3 className={styles.productName}>{product.name}</h3>
                    </Link>

                    <div className={styles.productRating} aria-label={`Rating ${product.averageRating} out of 5`}>
                      <span className={styles.ratingStars}>
                        {'★'.repeat(rounded)}
                        <span className={styles.ratingStarsEmpty}>{'★'.repeat(5 - rounded)}</span>
                      </span>
                      {product.totalRatings > 0 ? (
                        <span className={styles.ratingValue}>
                          {product.averageRating.toFixed(1)}{' '}
                          <span className={styles.ratingCount}>({product.totalRatings})</span>
                        </span>
                      ) : (
                        <span className={styles.ratingCount}>(0)</span>
                      )}
                    </div>

                    <p className={`${styles.productStock} ${outOfStock ? styles.outOfStock : ''}`}>
                      {outOfStock
                        ? t('shop.outOfStock') || 'Out of Stock'
                        : t('shop.inStock', { count: product.stock }) || `In Stock: ${product.stock}`}
                    </p>

                    {daysLeft !== null && (
                      <p style={{ fontSize: '0.8rem', color: '#c0392b', margin: '-0.25rem 0 0.4rem' }}>
                        {daysLeft === 0
                          ? t('deals.endsToday', { defaultValue: 'Ends today!' })
                          : daysLeft === 1
                            ? t('deals.dayLeft', { defaultValue: '1 day left' })
                            : t('deals.daysLeft', { count: daysLeft, defaultValue: `${daysLeft} days left` })}
                      </p>
                    )}

                    <div className={styles.productFooter}>
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ textDecoration: 'line-through', color: '#8a7e6f', fontSize: '0.9rem' }}>
                          ${product.basePrice.toFixed(2)}
                        </span>
                        <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                      </span>
                      <div className={styles.actions}>
                        <button
                          className={styles.wishlistButton}
                          disabled={wishlistLoadingId === product.id}
                          onClick={() => handleAddToWishlist(product.id)}
                          title="Add to Wishlist"
                        >
                          {wishlistLoadingId === product.id ? '...' : '♡'}
                        </button>
                        <button
                          className={styles.addButton}
                          disabled={outOfStock || isAdding}
                          onClick={() => handleAddToCart(product)}
                        >
                          {isAdding
                            ? t('shop.adding') || 'Adding...'
                            : t('shop.addToCart') || 'Add to Cart'}
                        </button>
                      </div>
                    </div>

                    {productFeedback && (
                      <p
                        className={
                          productFeedback.type === 'success' ? styles.successMessage : styles.errorMessage
                        }
                      >
                        {productFeedback.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Deals;
