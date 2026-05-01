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

interface ManagedOrder {
  _id: string;
  customer: { name: string; email: string } | null;
  totalAmount: number;
  orderStatus: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: string;
  items: any[];
}

type Tab = 'comments' | 'stock' | 'orders';

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

  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

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

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await axios.get(`${API_BASE}/orders`);
      setOrders(res.data || []);
      setOrdersError('');
    } catch (err: any) {
      setOrdersError(err.response?.data?.message || 'Could not load orders.');
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setRowFeedback({ id: orderId, type: 'success', message: 'Updating...' });
      await axios.patch(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus as any } : o)));
      setRowFeedback({ id: orderId, type: 'success', message: 'Status updated.' });
    } catch (err: any) {
      setRowFeedback({
        id: orderId,
        type: 'error',
        message: err.response?.data?.message || 'Update failed.',
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manager Dashboard</h1>
        <p className={styles.subtitle}>Moderate comments, manage stock, and track deliveries.</p>
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
        <button
          className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => setTab('orders')}
        >
          Orders & Delivery
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
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'orders' && (
        <section className={styles.panel}>
          {ordersLoading ? (
            <p className={styles.muted}>Loading orders...</p>
          ) : ordersError ? (
            <p className={styles.error}>{ordersError}</p>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No orders have been placed yet.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Placed At</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Update Status</th>
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
                            {o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).replace('-', ' ')}
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
                              <option value="processing">Processing</option>
                              <option value="in-transit">In Transit</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled" disabled>Cancelled</option>
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
