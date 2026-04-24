import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ManagerDashboard.module.css';

const API_BASE = 'http://localhost:5000/api';

interface PendingComment {
  _id: string;
  text: string;
  createdAt: string;
  product: { _id: string; name: string } | null;
  customer: { _id: string; name: string } | null;
}

interface ManagedProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

type Tab = 'comments' | 'stock';

const ManagerDashboard: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isManager = user?.role === 'productManager';

  const [tab, setTab] = useState<Tab>('comments');

  const [comments, setComments] = useState<PendingComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowFeedback, setRowFeedback] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [search, setSearch] = useState('');

  const fetchPending = async () => {
    try {
      setCommentsLoading(true);
      const res = await axios.get(`${API_BASE}/reviews/pending`);
      setComments(res.data || []);
      setCommentsError('');
    } catch (err: any) {
      setCommentsError(err.response?.data?.message || 'Could not load pending comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data || []);
      setProductsError('');
    } catch (err: any) {
      setProductsError(err.response?.data?.message || 'Could not load products.');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!isManager) return;
    fetchPending();
    fetchProducts();
  }, [isManager]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isManager) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Access Denied</h2>
          <p>This area is reserved for product managers.</p>
        </div>
      </div>
    );
  }

  const handleDecision = async (commentId: string, status: 'approved' | 'rejected') => {
    setActingId(commentId);
    try {
      await axios.patch(`${API_BASE}/reviews/comment/${commentId}`, {
        status,
        managerId: user.id || user._id,
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setActingId(null);
    }
  };

  const handleStockSave = async (productId: string) => {
    const draft = stockDrafts[productId];
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 0) {
      setRowFeedback({ id: productId, type: 'error', message: 'Stock must be a non-negative whole number.' });
      return;
    }
    setSavingId(productId);
    try {
      const res = await axios.patch(`${API_BASE}/products/${productId}/stock`, { stock: value });
      const updated: ManagedProduct = res.data.product;
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, stock: updated.stock } : p)));
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setRowFeedback({ id: productId, type: 'success', message: 'Stock updated.' });
    } catch (err: any) {
      setRowFeedback({
        id: productId,
        type: 'error',
        message: err.response?.data?.message || 'Update failed.',
      });
    } finally {
      setSavingId(null);
      setTimeout(() => setRowFeedback(null), 2500);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manager Dashboard</h1>
        <p className={styles.subtitle}>Moderate customer comments and manage product stock.</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'comments' ? styles.tabActive : ''}`}
          onClick={() => setTab('comments')}
        >
          Pending Comments
          {comments.length > 0 && <span className={styles.badge}>{comments.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'stock' ? styles.tabActive : ''}`}
          onClick={() => setTab('stock')}
        >
          Stock Management
        </button>
      </div>

      {tab === 'comments' && (
        <section className={styles.panel}>
          {commentsLoading ? (
            <p className={styles.muted}>Loading pending comments...</p>
          ) : commentsError ? (
            <p className={styles.error}>{commentsError}</p>
          ) : comments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>&#9989;</div>
              <p>No pending comments. You're all caught up.</p>
            </div>
          ) : (
            <div className={styles.commentList}>
              {comments.map((c) => {
                const isActing = actingId === c._id;
                return (
                  <div key={c._id} className={styles.commentCard}>
                    <div className={styles.commentMeta}>
                      <div>
                        <div className={styles.metaLabel}>Product</div>
                        <div className={styles.metaValue}>{c.product?.name ?? '—'}</div>
                      </div>
                      <div>
                        <div className={styles.metaLabel}>Customer</div>
                        <div className={styles.metaValue}>{c.customer?.name ?? '—'}</div>
                      </div>
                      <div>
                        <div className={styles.metaLabel}>Submitted</div>
                        <div className={styles.metaValue}>{formatDate(c.createdAt)}</div>
                      </div>
                    </div>
                    <p className={styles.commentText}>{c.text}</p>
                    <div className={styles.commentActions}>
                      <button
                        className={styles.approveButton}
                        disabled={isActing}
                        onClick={() => handleDecision(c._id, 'approved')}
                      >
                        {isActing ? '...' : 'Approve'}
                      </button>
                      <button
                        className={styles.rejectButton}
                        disabled={isActing}
                        onClick={() => handleDecision(c._id, 'rejected')}
                      >
                        {isActing ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'stock' && (
        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={styles.muted}>
              {filteredProducts.length} of {products.length} products
            </span>
          </div>

          {productsLoading ? (
            <p className={styles.muted}>Loading products...</p>
          ) : productsError ? (
            <p className={styles.error}>{productsError}</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th>New Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const draft = stockDrafts[p._id];
                    const hasDraft = draft !== undefined && draft !== String(p.stock);
                    const isSaving = savingId === p._id;
                    const feedback = rowFeedback && rowFeedback.id === p._id ? rowFeedback : null;
                    const lowStock = p.stock === 0;

                    return (
                      <tr key={p._id}>
                        <td className={styles.productCell}>
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt={p.name} className={styles.thumb} />
                          )}
                          <span>{p.name}</span>
                        </td>
                        <td>{p.category}</td>
                        <td>${p.price.toFixed(2)}</td>
                        <td>
                          <span className={`${styles.stockValue} ${lowStock ? styles.stockZero : ''}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={styles.stockInput}
                            value={draft ?? String(p.stock)}
                            onChange={(e) =>
                              setStockDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            className={styles.saveButton}
                            disabled={!hasDraft || isSaving}
                            onClick={() => handleStockSave(p._id)}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          {feedback && (
                            <span
                              className={
                                feedback.type === 'success' ? styles.successInline : styles.errorInline
                              }
                            >
                              {feedback.message}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.muted} style={{ textAlign: 'center', padding: '2rem' }}>
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ManagerDashboard;
