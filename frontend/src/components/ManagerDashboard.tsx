import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './ManagerDashboard.module.css';

const API_BASE = 'http://localhost:5000/api';

interface PendingComment {
  _id: string;
  text: string;
  createdAt: string;
  product: { _id: string; name: string } | null;
  customer: { _id: string; name: string } | null;
  customerRating?: number | null;
}

interface ManagedProduct {
  _id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

interface ManagedOrder {
  _id: string;
  customer: { name: string; email: string } | null;
  totalAmount: number;
  orderStatus: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: string;
  items: any[];
}

type Tab = 'comments' | 'stock' | 'orders';
type StockSort = 'default' | 'low-to-high' | 'high-to-low';



const ManagerDashboard: React.FC = () => {
  const { t } = useTranslation();
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

  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const [rowFeedback, setRowFeedback] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockSort, setStockSort] = useState<StockSort>('default');

  const fetchPending = async () => {
    try {
      setCommentsLoading(true);
      const res = await axios.get(`${API_BASE}/reviews/pending`);
      setComments(res.data || []);
      setCommentsError('');
    } catch (err: any) {
      setCommentsError(err.response?.data?.message || t('managerDashboard.loadCommentsError'));
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
      setProductsError(err.response?.data?.message || t('managerDashboard.loadProductsError'));
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await axios.get(`${API_BASE}/orders`);
      setOrders(res.data || []);
      setOrdersError('');
    } catch (err: any) {
      setOrdersError(err.response?.data?.message || t('managerDashboard.loadOrdersError'));
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!isManager) return;
    fetchPending();
    fetchProducts();
    fetchOrders();
  }, [isManager]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isManager) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>{t('managerDashboard.accessDeniedTitle')}</h2>
          <p>{t('managerDashboard.accessDeniedMessage')}</p>
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
      alert(err.response?.data?.message || t('managerDashboard.actionFailed'));
    } finally {
      setActingId(null);
    }
  };

  const handleStockSave = async (productId: string) => {
    const draft = stockDrafts[productId];
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 0) {
      setRowFeedback({ id: productId, type: 'error', message: t('managerDashboard.stockInvalid') });
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
      setRowFeedback({ id: productId, type: 'success', message: t('managerDashboard.stockUpdated') });
    } catch (err: any) {
      setRowFeedback({
        id: productId,
        type: 'error',
        message: err.response?.data?.message || t('managerDashboard.updateFailed'),
      });
    } finally {
      setSavingId(null);
      setTimeout(() => setRowFeedback(null), 2500);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setRowFeedback({ id: orderId, type: 'success', message: t('managerDashboard.updating') });
      await axios.patch(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus as any } : o)));
      setRowFeedback({ id: orderId, type: 'success', message: t('managerDashboard.statusUpdated') });
    } catch (err: any) {
      setRowFeedback({
        id: orderId,
        type: 'error',
        message: err.response?.data?.message || t('managerDashboard.updateFailed'),
      });
    } finally {
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

  const orderStatusLabel = (status: ManagedOrder['orderStatus']) => {
    switch (status) {
      case 'processing':
        return t('managerDashboard.statusProcessing');
      case 'in-transit':
        return t('managerDashboard.statusInTransit');
      case 'delivered':
        return t('managerDashboard.statusDelivered');
      case 'cancelled':
        return t('managerDashboard.statusCancelled');
    }
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ).sort();

  const filteredProducts = products
    .filter((p) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        (p.model || '').toLowerCase().includes(searchTerm) ||
        (p.serialNumber || '').toLowerCase().includes(searchTerm);

      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (stockSort === 'low-to-high') {
        return a.stock - b.stock;
      }

      if (stockSort === 'high-to-low') {
        return b.stock - a.stock;
      }

      return 0;
    });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('managerDashboard.title')}</h1>
        <p className={styles.subtitle}>{t('managerDashboard.subtitle')}</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'comments' ? styles.tabActive : ''}`}
          onClick={() => setTab('comments')}
        >
          {t('managerDashboard.tabComments')}
          {comments.length > 0 && <span className={styles.badge}>{comments.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'stock' ? styles.tabActive : ''}`}
          onClick={() => setTab('stock')}
        >
          {t('managerDashboard.tabStock')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => setTab('orders')}
        >
          {t('managerDashboard.tabOrders')}
        </button>
      </div>

      {tab === 'comments' && (
        <section className={styles.panel}>
          {commentsLoading ? (
            <p className={styles.muted}>{t('managerDashboard.loadingComments')}</p>
          ) : commentsError ? (
            <p className={styles.error}>{commentsError}</p>
          ) : comments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>&#9989;</div>
              <p>{t('managerDashboard.noComments')}</p>
            </div>
          ) : (
            <div className={styles.commentList}>
              {comments.map((c) => {
                const isActing = actingId === c._id;
                return (
                  <div key={c._id} className={styles.commentCard}>
                    <div className={styles.commentMeta}>
                      <div>
                        <div className={styles.metaLabel}>{t('managerDashboard.product')}</div>
                        <div className={styles.metaValue}>{c.product?.name ?? '—'}</div>
                      </div>
                      <div>
                        <div className={styles.metaLabel}>{t('managerDashboard.customer')}</div>
                        <div className={styles.metaValue}>
                          {c.customer?.name ?? '—'}
                          {c.customerRating && (
                            <span style={{ color: '#ffd700', marginLeft: '0.5rem' }}>
                              {'★'.repeat(c.customerRating)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className={styles.metaLabel}>{t('managerDashboard.submitted')}</div>
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
                        {isActing ? '...' : t('managerDashboard.approve')}
                      </button>
                      <button
                        className={styles.rejectButton}
                        disabled={isActing}
                        onClick={() => handleDecision(c._id, 'rejected')}
                      >
                        {isActing ? '...' : t('managerDashboard.reject')}
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
              placeholder={t('managerDashboard.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className={styles.statusSelect}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">{t('managerDashboard.allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className={styles.statusSelect}
              value={stockSort}
              onChange={(e) => setStockSort(e.target.value as StockSort)}
            >
              <option value="default">{t('managerDashboard.sortDefault')}</option>
              <option value="low-to-high">{t('managerDashboard.sortLowToHigh')}</option>
              <option value="high-to-low">{t('managerDashboard.sortHighToLow')}</option>
            </select>

            <span className={styles.muted}>
              {t('managerDashboard.productsCount', { filtered: filteredProducts.length, total: products.length })}
            </span>
          </div>

          {productsLoading ? (
            <p className={styles.muted}>{t('managerDashboard.loadingProducts')}</p>
          ) : productsError ? (
            <p className={styles.error}>{productsError}</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('managerDashboard.product')}</th>
                    <th>{t('managerDashboard.category')}</th>
                    <th>{t('managerDashboard.price')}</th>
                    <th>{t('managerDashboard.currentStock')}</th>
                    <th>{t('managerDashboard.newStock')}</th>
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
                            {isSaving ? t('managerDashboard.saving') : t('managerDashboard.save')}
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
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'orders' && (
        <section className={styles.panel}>
          {ordersLoading ? (
            <p className={styles.muted}>{t('managerDashboard.loadingOrders')}</p>
          ) : ordersError ? (
            <p className={styles.error}>{ordersError}</p>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{t('managerDashboard.noOrders')}</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('managerDashboard.orderId')}</th>
                    <th>{t('managerDashboard.customer')}</th>
                    <th>{t('managerDashboard.placedAt')}</th>
                    <th>{t('managerDashboard.amount')}</th>
                    <th>{t('managerDashboard.status')}</th>
                    <th>{t('managerDashboard.updateStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const feedback = rowFeedback && rowFeedback.id === o._id ? rowFeedback : null;
                    const statusKey = o.orderStatus.replace('-', '_');

                    return (
                      <tr key={o._id}>
                        <td style={{ fontWeight: 600 }}>#{o._id.slice(-8).toUpperCase()}</td>
                        <td>
                          <div>{o.customer?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{o.customer?.email}</div>
                        </td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>${o.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`${styles[`status_${statusKey}`]}`} style={{ fontWeight: 600 }}>
                            {orderStatusLabel(o.orderStatus)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            <select
                              className={styles.statusSelect}
                              value={o.orderStatus}
                              disabled={o.orderStatus === 'cancelled'}
                              onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                            >
                              <option value="processing">{t('managerDashboard.statusProcessing')}</option>
                              <option value="in-transit">{t('managerDashboard.statusInTransit')}</option>
                              <option value="delivered">{t('managerDashboard.statusDelivered')}</option>
                              <option value="cancelled" disabled>{t('managerDashboard.statusCancelled')}</option>
                            </select>
                            {feedback && (
                              <span className={feedback.type === 'success' ? styles.successInline : styles.errorInline}>
                                {feedback.message}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
