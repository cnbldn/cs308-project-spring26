import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './OrderHistory.module.css';

const API_BASE = 'http://localhost:5000/api';

interface OrderItem {
  product: string;
  name: string;
  model: string;
  serialNumber: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StatusHistoryEntry {
  status: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  changedAt: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  statusHistory: StatusHistoryEntry[];
  placedAt: string;
  createdAt: string;
}

const STATUS_STEPS: Array<Order['orderStatus']> = ['processing', 'in-transit', 'delivered'];

const STATUS_LABELS: Record<Order['orderStatus'], string> = {
  processing: 'Processing',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const customerId = user?.id || user?._id;

  const fetchOrders = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/orders/history/${customerId}`);
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStepIndex = (status: Order['orderStatus']) => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? Items will be returned to stock.')) return;
    try {
      await axios.patch(`${API_BASE}/orders/${orderId}/cancel`);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not cancel the order.');
    }
  };

  const handleReturnRequest = async (orderId: string, productId: string) => {
    const reason = window.prompt('Please enter a reason for the return:');
    if (reason === null) return; // User cancelled prompt

    try {
      await axios.post(`${API_BASE}/orders/${orderId}/return-request`, {
        productId,
        quantity: 1, // Simple 1-qty return for now
        reason
      });
      alert('Return request submitted successfully.');
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not submit return request.');
    }
  };

  const isEligibleForReturn = (order: Order) => {
    if (order.orderStatus !== 'delivered') return false;
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const placedDate = new Date(order.placedAt || order.createdAt).getTime();
    return (Date.now() - placedDate) < thirtyDaysInMs;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.muted}>Loading your orders...</p>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <h2>Order History</h2>
          <p>Please sign in to view your orders.</p>
          <Link to="/login" className={styles.primaryButton}>Sign In</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Order History</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Order History</h2>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>&#128230;</div>
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className={styles.primaryButton}>Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Order History</h2>
      <p className={styles.subtitle}>Track the status of your past purchases.</p>

      <div className={styles.list}>
        {orders.map((order) => {
          const step = currentStepIndex(order.orderStatus);
          const isCancelled = order.orderStatus === 'cancelled';
          const isExpanded = expandedId === order._id;
          const statusKey = order.orderStatus.replace('-', '_');

          return (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <div className={styles.orderMeta}>Order ID</div>
                  <div className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</div>
                </div>
                <div>
                  <div className={styles.orderMeta}>Placed On</div>
                  <div className={styles.orderValue}>{formatDate(order.placedAt || order.createdAt)}</div>
                </div>
                <div>
                  <div className={styles.orderMeta}>Total</div>
                  <div className={styles.orderValue}>${order.totalAmount.toFixed(2)}</div>
                </div>
                <div className={`${styles.statusBadge} ${styles[`status_${statusKey}`]}`}>
                  {STATUS_LABELS[order.orderStatus]}
                </div>
              </div>

              {isCancelled ? (
                <div className={styles.cancelledBanner}>
                  This order was cancelled and items were returned to stock.
                </div>
              ) : (
                <div className={styles.tracker}>
                  {STATUS_STEPS.map((stepName, idx) => {
                    const reached = idx <= step;
                    const isCurrent = idx === step;
                    return (
                      <React.Fragment key={stepName}>
                        <div className={styles.trackerStep}>
                          <div
                            className={`${styles.stepDot} ${reached ? styles.stepDotActive : ''} ${isCurrent ? styles.stepDotCurrent : ''}`}
                          >
                            {reached ? '✓' : idx + 1}
                          </div>
                          <div className={`${styles.stepLabel} ${reached ? styles.stepLabelActive : ''}`}>
                            {STATUS_LABELS[stepName]}
                          </div>
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`${styles.stepConnector} ${idx < step ? styles.stepConnectorActive : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              <div className={styles.orderActions}>
                <button
                  className={styles.detailsButton}
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
                {order.orderStatus === 'processing' && (
                  <button
                    className={styles.cancelButton}
                    onClick={() => handleCancel(order._id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.detailsSection}>
                    <h4>Items</h4>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => {
                          const canReturn = isEligibleForReturn(order) && item.returnStatus === 'none';
                          return (
                            <tr key={`${order._id}-${idx}`}>
                              <td>
                                {item.name}
                                {item.returnStatus !== 'none' && (
                                  <span className={`${styles.itemBadge} ${styles[`status_${item.returnStatus}`]}`}>
                                    {item.returnStatus.toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td>{item.quantity}</td>
                              <td>${item.unitPrice.toFixed(2)}</td>
                              <td>
                                {canReturn ? (
                                  <button 
                                    className={styles.miniReturnButton}
                                    onClick={() => handleReturnRequest(order._id, item.product)}
                                  >
                                    Request Return
                                  </button>
                                ) : (
                                  `$${item.lineTotal.toFixed(2)}`
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailsSection}>
                    <h4>Delivery Address</h4>
                    <p className={styles.address}>{order.deliveryAddress}</p>
                  </div>

                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <div className={styles.detailsSection}>
                      <h4>Status Timeline</h4>
                      <ul className={styles.timeline}>
                        {order.statusHistory.map((entry, idx) => (
                          <li key={idx}>
                            <span className={styles.timelineStatus}>
                              {STATUS_LABELS[entry.status]}
                            </span>
                            <span className={styles.timelineDate}>
                              {formatDate(entry.changedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
