import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './Shop.module.css';
import ProductImageHover from './ProductImageHover';

const API_BASE = 'http://localhost:5000/api';

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
  averageRating?: number;
  totalRatings?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  averageRating: number;
  totalRatings: number;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/161210/ffd700?text=No+Image';

const normalize = (raw: RawProduct): Product => ({
  id: raw._id ?? raw.id ?? '',
  name: raw.name,
  description: raw.description ?? '',
  category: raw.category,
  price: raw.price,
  stock: raw.stock,
  image: raw.imageUrl || raw.image || PLACEHOLDER_IMAGE,
  averageRating: raw.averageRating ?? 0,
  totalRatings: raw.totalRatings ?? 0,
});

// Helper to handle guest session IDs (Fulfills Req #4)
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

const Shop: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter & sort state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('');

  // Debounce timer ref for search
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = async (
    searchVal: string,
    categoryVal: string,
    sortVal: string
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchVal.trim()) params.search = searchVal.trim();
      if (categoryVal) params.category = categoryVal;
      if (sortVal) params.sort = sortVal;

      const res = await axios.get<RawProduct[]>(`${API_BASE}/products`, {
        params,
      });
      setProducts(res.data.map(normalize));
      setError('');
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(t('shop.loadError') || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get<string[]>(`${API_BASE}/products/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when category or sort changes (immediate)
  useEffect(() => {
    fetchProducts(search, selectedCategory, sort);
  }, [selectedCategory, sort]);

  // Debounced search — waits 400ms after the user stops typing
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProducts(value, selectedCategory, sort);
    }, 400);
  };

  const handleAddToCart = async (product: Product) => {
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
      setFeedback({
        id: product.id,
        type: 'success',
        message: t('shop.added') || 'Added to cart!',
      });
    } catch (err: any) {
      console.error('Add to cart failed:', err);
      const message = err.response?.data?.message || t('shop.addToCartFailed') || 'Failed to add to cart';
      setFeedback({ id: product.id, type: 'error', message });
    } finally {
      setAddingId(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className={styles.shopContainer}>
      <h2 className={styles.shopTitle}>{t('shop.title') || 'Shop'}</h2>
      <p className={styles.shopSubtitle}>{t('shop.subtitle') || 'Explore our collection'}</p>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <h4 className={styles.sidebarTitle}>{t('shop.categories') || 'Categories'}</h4>
          <ul className={styles.categoryList}>
            <li className={styles.categoryItem}>
              <button
                className={`${styles.categoryButton} ${selectedCategory === '' ? styles.activeCategory : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                {t('shop.allProducts') || 'All Products'}
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat} className={styles.categoryItem}>
                <button
                  className={`${styles.categoryButton} ${selectedCategory === cat ? styles.activeCategory : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.contentArea}>
          <div className={styles.toolbar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t('shop.searchPlaceholder') || 'Search products...'}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <select
              className={styles.selectInput}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">{t('shop.sortDefault') || 'Newest'}</option>
              <option value="price_asc">{t('shop.sortPriceAsc') || 'Price: Low to High'}</option>
              <option value="price_desc">{t('shop.sortPriceDesc') || 'Price: High to Low'}</option>
              <option value="popularity">{t('shop.sortPopularity') || 'Popularity'}</option>
            </select>
          </div>

          {loading && products.length === 0 ? (
            <p className={styles.shopSubtitle}>{t('shop.loading') || 'Loading...'}</p>
          ) : error ? (
            <p className={styles.errorMessage}>{error}</p>
          ) : (
            <div className={styles.productGrid}>
              {products.length > 0 ? (
                products.map((product) => {
                  const outOfStock = product.stock === 0;
                  const isAdding = addingId === product.id;
                  const productFeedback = feedback && feedback.id === product.id ? feedback : null;
                  const rounded = Math.round(product.averageRating);

                  return (
                    <div key={product.id} className={styles.productCard}>
                      <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                        <ProductImageHover src={product.image} alt={product.name} />
                        <p className={styles.productCategory}>{product.category}</p>
                        <h3 className={styles.productName}>{product.name}</h3>
                      </Link>
                      <div className={styles.productRating} aria-label={`Rating ${product.averageRating} out of 5`}>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(rounded)}<span className={styles.ratingStarsEmpty}>{'★'.repeat(5 - rounded)}</span>
                        </span>
                        {product.totalRatings > 0 ? (
                          <span className={styles.ratingValue}>
                            {product.averageRating.toFixed(1)} <span className={styles.ratingCount}>({product.totalRatings})</span>
                          </span>
                        ) : (
                          <span className={styles.ratingCount}>(0)</span>
                        )}
                      </div>
                      <p className={`${styles.productStock} ${outOfStock ? styles.outOfStock : ''}`}>
                        {outOfStock ? (t('shop.outOfStock') || 'Out of Stock') : (t('shop.inStock', { count: product.stock }) || `In Stock: ${product.stock}`)}
                      </p>
                      <div className={styles.productFooter}>
                        <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                        <button
                          className={styles.addButton}
                          disabled={outOfStock || isAdding}
                          onClick={() => handleAddToCart(product)}
                        >
                          {isAdding ? (t('shop.adding') || 'Adding...') : (t('shop.addToCart') || 'Add to Cart')}
                        </button>
                      </div>
                      {productFeedback && (
                        <p className={productFeedback.type === 'success' ? styles.successMessage : styles.errorMessage}>
                          {productFeedback.message}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className={styles.shopSubtitle}>{t('shop.noProducts') || 'No products found.'}</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
