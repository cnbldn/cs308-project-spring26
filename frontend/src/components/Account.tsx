import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Account.module.css';

const API_BASE = 'http://localhost:5000/api';

interface OrderItem { name: string; quantity: number; lineTotal: number; }
interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  placedAt: string;
  createdAt: string;
}

const STATUS_COLOR: Record<Order['orderStatus'], string> = {
  processing: '#d4a017',
  'in-transit': '#4a9eff',
  delivered: '#4caf78',
  cancelled: '#e05050',
};

const Account: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!user) return;
    const id = user.id || user._id;
    axios
      .get(`${API_BASE}/orders/history/${id}`)
      .then((res) => setRecentOrders((res.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  if (!user) {
    navigate('/login');
    return null;
  }

  const initials = user.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) return setPwError(t('account.currentPasswordRequired'));
    if (!newPassword) return setPwError(t('account.newPasswordRequired'));
    if (newPassword.length < 6) return setPwError(t('account.newPasswordMinLength'));
    if (newPassword !== confirmPassword) return setPwError(t('account.passwordMismatch'));

    setPwSaving(true);
    try {
      await axios.patch(`${API_BASE}/auth/change-password`, {
        customerId: user.id || user._id,
        currentPassword,
        newPassword,
      });
      setPwSuccess(t('account.passwordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.response?.data?.message || t('account.passwordError'));
    } finally {
      setPwSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const statusLabel: Record<Order['orderStatus'], string> = {
    processing: t('orders.status_processing'),
    'in-transit': t('orders.status_in_transit'),
    delivered: t('orders.status_delivered'),
    cancelled: t('orders.status_cancelled'),
  };

  return (
    <div className={styles.container}>

      {/* ── Avatar header ── */}
      <div className={styles.heroCard}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroName}>{user.name}</h1>
          <p className={styles.heroEmail}>{user.email}</p>
          {memberSince && <p className={styles.heroSince}>Member since {memberSince}</p>}
        </div>
      </div>

      <div className={styles.grid}>

        {/* ── Profile info ── */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>{t('account.title')}</h3>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.name')}</label>
            <div className={styles.value}>{user.name}</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.email')}</label>
            <div className={styles.value}>{user.email}</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.address')}</label>
            <div className={styles.value}>{user.homeAddress || '—'}</div>
          </div>

          {user.taxId && (
            <div className={styles.field}>
              <label className={styles.label}>{t('account.taxId')}</label>
              <div className={styles.value}>{user.taxId}</div>
            </div>
          )}
        </div>

        {/* ── Recent orders ── */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{t('orders.recentOrders')}</h3>
            <Link to="/orders" className={styles.viewAll}>{t('orders.viewAll')}</Link>
          </div>

          {ordersLoading ? (
            <p className={styles.muted}>{t('orders.loading')}</p>
          ) : recentOrders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <p className={styles.muted}>{t('orders.noOrders')}</p>
              <Link to="/shop" className={styles.shopLink}>{t('orders.browseShop')}</Link>
            </div>
          ) : (
            <ul className={styles.orderList}>
              {recentOrders.map((order) => (
                <li key={order._id} className={styles.orderRow}>
                  <div className={styles.orderLeft}>
                    <span className={styles.orderId}>#{order._id.slice(-7).toUpperCase()}</span>
                    <span className={styles.orderDate}>{formatDate(order.placedAt || order.createdAt)}</span>
                    <span className={styles.orderItems}>
                      {t('orders.itemCount', { count: order.items.length })}
                    </span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>${order.totalAmount.toFixed(2)}</span>
                    <span
                      className={styles.orderStatus}
                      style={{ color: STATUS_COLOR[order.orderStatus] }}
                    >
                      {statusLabel[order.orderStatus]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Change password ── */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h3 className={styles.sectionTitle}>{t('account.passwordSection')}</h3>

          <form onSubmit={handleChangePassword} className={styles.pwForm}>
            <div className={styles.pwFields}>
              <div className={styles.field}>
                <label className={styles.label}>{t('account.currentPassword')}</label>
                <input
                  type="password"
                  className={styles.input}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('account.newPassword')}</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('account.confirmPassword')}</label>
                <input
                  type="password"
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {pwError && <p className={styles.error}>{pwError}</p>}
            {pwSuccess && <p className={styles.success}>{pwSuccess}</p>}

            <button type="submit" className={styles.button} disabled={pwSaving}>
              {pwSaving ? t('account.saving') : t('account.savePassword')}
            </button>
          </form>
        </div>

      </div>

      <button onClick={handleLogout} className={styles.logoutButton}>
        {t('account.logout')}
      </button>
    </div>
  );
};

export default Account;
