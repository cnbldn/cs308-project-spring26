import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styles from './ProductDetail.module.css';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:5000/api';

interface ReviewData {
  averageRating: number;
  totalRatings: number;
  comments: any[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewData>({ averageRating: 0, totalRatings: 0, comments: [] });
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          axios.get(`${API_BASE}/products/${id}`),
          axios.get(`${API_BASE}/reviews/product/${id}`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const sessionId = localStorage.getItem('sessionId');
      await axios.post(`${API_BASE}/cart/add`, {
        productId: product._id,
        quantity: 1,
        customerId: user?.id || user?._id || null,
        sessionId: !user ? sessionId : null
      });
      await refreshCart();
      setFeedback({ type: 'success', message: t('shop.added') });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || t('productDetail.addFailed') });
    }
  };

  const handleRate = async (value: number) => {
    if (!user) {
      setFeedback({ type: 'error', message: t('productDetail.loginToRate') });
      return;
    }
    try {
      await axios.post(`${API_BASE}/reviews/rate`, {
        productId: id,
        customerId: user.id || user._id,
        value: value
      });
      setUserRating(value);
      setFeedback({ type: 'success', message: t('productDetail.ratingUpdated') });
      const revRes = await axios.get(`${API_BASE}/reviews/product/${id}`);
      setReviews(revRes.data);
    } catch (err) {
      setFeedback({ type: 'error', message: t('productDetail.ratingFailed') });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFeedback({ type: 'error', message: t('productDetail.loginToComment') });
      return;
    }
    if (!commentText.trim()) return;

    try {
      await axios.post(`${API_BASE}/reviews/comment`, {
        productId: id,
        customerId: user.id || user._id,
        text: commentText
      });
      setFeedback({ type: 'success', message: t('productDetail.commentSubmitted') });
      setCommentText('');
    } catch (err) {
      setFeedback({ type: 'error', message: t('productDetail.commentFailed') });
    }
  };

  if (loading) return <div className={styles.container}>{t('productDetail.loading')}</div>;
  if (!product) return <div className={styles.container}>{t('productDetail.notFound')}</div>;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← {t('cart.continueShopping')}
      </button>

      <div className={styles.mainSection}>
        <div className={styles.imageContainer}>
          <img src={product.imageUrl || 'https://placehold.co/600x600'} alt={product.name} className={styles.productImage} />
        </div>

        <div className={styles.infoSection}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>${product.price.toFixed(2)}</div>

          <p className={styles.description}>{product.description}</p>

          <div className={styles.stock}>
            {t('productDetail.status')} <span className={product.stock > 0 ? styles.inStock : styles.outOfStock}>
              {product.stock > 0
                ? t('productDetail.inStock', { count: product.stock })
                : t('productDetail.outOfStock')}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.addButton}
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              {t('shop.addToCart')}
            </button>
          </div>
          {feedback && <div className={feedback.type === 'success' ? styles.success : styles.error}>{feedback.message}</div>}
        </div>
      </div>

      <section className={styles.specsSection}>
        <h3 className={styles.sectionTitle}>{t('productDetail.techSpecs')}</h3>
        <div className={styles.specsGrid}>
          <div className={styles.specItem}>
            <h5>{t('productDetail.model')}</h5>
            <p>{product.model}</p>
          </div>
          <div className={styles.specItem}>
            <h5>{t('productDetail.serialNumber')}</h5>
            <p>{product.serialNumber}</p>
          </div>
          <div className={styles.specItem}>
            <h5>{t('productDetail.warrantyStatus')}</h5>
            <p style={{ textTransform: 'capitalize' }}>{product.warrantyStatus}</p>
          </div>
          <div className={styles.specItem}>
            <h5>{t('productDetail.distributor')}</h5>
            <p>{product.distributorInfo?.name} ({product.distributorInfo?.country})</p>
          </div>
        </div>
      </section>

      <section className={styles.reviewsSection}>
        <h3 className={styles.sectionTitle}>{t('productDetail.reviews')}</h3>

        <div className={styles.ratingOverview}>
          <div className={styles.avgValue}>{reviews.averageRating}</div>
          <div>
            <div className={styles.stars}>{'★'.repeat(Math.round(reviews.averageRating))}{'☆'.repeat(5 - Math.round(reviews.averageRating))}</div>
            <div style={{ fontSize: '0.8rem', color: '#8a7d62' }}>{t('productDetail.ratings', { count: reviews.totalRatings })}</div>
          </div>
        </div>

        {user && (
          <div className={styles.reviewActions}>
            <div className={styles.ratingBox}>
              <h4>{t('productDetail.yourRating')}</h4>
              <div className={styles.starInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className={star <= userRating ? styles.starActive : styles.starInactive}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <form className={styles.commentForm} onSubmit={handleComment}>
              <h4>{t('productDetail.writeComment')}</h4>
              <textarea
                className={styles.textArea}
                placeholder={t('productDetail.commentPlaceholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className={styles.addButton} disabled={!commentText.trim()}>
                {t('productDetail.postComment')}
              </button>
            </form>
          </div>
        )}

        <div className={styles.commentList}>
          {reviews.comments.length > 0 ? reviews.comments.map((comment: any) => (
            <div key={comment._id} className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <span className={styles.commentUser}>{comment.customer?.name}</span>
                <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={styles.commentText}>{comment.text}</p>
            </div>
          )) : (
            <p style={{ color: '#8a7d62' }}>{t('productDetail.noReviews')}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
