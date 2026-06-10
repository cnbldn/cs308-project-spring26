import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './NotificationBell.module.css';

const API_BASE = 'http://localhost:5000/api';
const POLL_INTERVAL_MS = 60000;

interface NotificationItem {
  _id: string;
  type: 'wishlist_discount' | 'order_update' | 'refund_update';
  title: string;
  message: string;
  product?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  customerId: string;
}

const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const NotificationBell: React.FC<Props> = ({ customerId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get<{ notifications: NotificationItem[]; unreadCount: number }>(
        `${API_BASE}/notifications/${customerId}`,
      );
      setItems(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
      setError(null);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Could not load notifications');
    }
  }, [customerId]);

  useEffect(() => {
    fetchNotifications();
    const id = window.setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleItemClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((it) => (it._id === n._id ? { ...it, isRead: true } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await axios.patch(`${API_BASE}/notifications/${customerId}/${n._id}/read`);
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    if (n.product) {
      setOpen(false);
      navigate(`/product/${n.product}`);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    setUnreadCount(0);
    try {
      await axios.patch(`${API_BASE}/notifications/${customerId}/read-all`);
    } catch (err) {
      console.error('Failed to mark all read:', err);
      fetchNotifications();
    }
  };

  const handleDismiss = async (e: React.MouseEvent, n: NotificationItem) => {
    e.stopPropagation();
    const wasUnread = !n.isRead;
    setItems((prev) => prev.filter((it) => it._id !== n._id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.delete(`${API_BASE}/notifications/${customerId}/${n._id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.header}>
            <span>Notifications</span>
            <button
              type="button"
              className={styles.markAll}
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {error ? (
            <p className={styles.error}>{error}</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>You're all caught up.</p>
          ) : (
            items.map((n) => (
              <div
                key={n._id}
                className={styles.item}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleItemClick(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(n);
                  }
                }}
              >
                {n.isRead ? <span className={styles.unreadDotPlaceholder} /> : <span className={styles.unreadDot} />}
                <div className={styles.body}>
                  <span className={styles.title}>{n.title}</span>
                  <span className={styles.message}>{n.message}</span>
                  <span className={styles.time}>{formatRelative(n.createdAt)}</span>
                </div>
                <button
                  type="button"
                  className={styles.dismiss}
                  onClick={(e) => handleDismiss(e, n)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
