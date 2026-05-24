import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import styles from './SalesManagerDashboard.module.css';

const API_BASE = 'http://localhost:5000/api';

interface ManagedProduct {
  _id: string;
  name: string;
  price: number;
  basePrice: number;
  discountRate: number;
  stock: number;
}

interface Financials {
  count: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
  profitMargin: number;
  categoryBreakdown: { name: string; value: number }[];
}

interface ManagedInvoice {
  _id: string;
  invoiceNumber: string;
  customer: { name: string; email: string } | null;
  totalAmount: number;
  issuedAt: string;
}

type Tab = 'pricing' | 'financials' | 'invoices' | 'returns';

const SalesManagerDashboard: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSalesManager = user?.role === 'salesManager';

  useEffect(() => {
    console.log('[SalesManagerDashboard] User Role:', user?.role);
  }, [user]);

  const [tab, setTab] = useState<Tab>('pricing');

  // Pricing State
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { basePrice?: string; discountRate?: string }>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Financials State
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [finLoading, setFinLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Invoices State
  const [invoices, setInvoices] = useState<ManagedInvoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  // Returns State
  const [returnOrders, setReturns] = useState<any[]>([]);
  const [retLoading, setRetLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [rowFeedback, setRowFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchFinancials = async () => {
    try {
      setFinLoading(true);
      const res = await axios.get(`${API_BASE}/orders/financials`, {
        params: { startDate, endDate }
      });
      setFinancials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFinLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setInvLoading(true);
      const res = await axios.get(`${API_BASE}/orders/invoices-list`, {
        params: { startDate, endDate }
      });
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setInvLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      setRetLoading(true);
      const res = await axios.get(`${API_BASE}/orders`);
      const requested = res.data.filter((o: any) => 
        o.items.some((i: any) => i.returnStatus === 'requested')
      );
      setReturns(requested);
    } catch (err) {
      console.error(err);
    } finally {
      setRetLoading(false);
    }
  };

  useEffect(() => {
    if (!isSalesManager) return;
    fetchProducts();
    fetchFinancials();
    fetchInvoices();
    fetchReturns();
  }, [isSalesManager]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isSalesManager) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Access Denied</h2>
          <p>This area is reserved for sales managers.</p>
        </div>
      </div>
    );
  }

  const handlePriceUpdate = async (productId: string) => {
    const draft = priceDrafts[productId];
    if (!draft) return;

    setUpdatingId(productId);
    try {
      const payload: any = {};
      if (draft.basePrice !== undefined) payload.basePrice = Number(draft.basePrice);
      if (draft.discountRate !== undefined) payload.discountRate = Number(draft.discountRate);

      const res = await axios.patch(`${API_BASE}/products/${productId}/price`, payload);
      const updated = res.data.product;

      setProducts(prev => prev.map(p => p._id === productId ? { ...p, ...updated } : p));
      setPriceDrafts(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      
      setRowFeedback({ id: productId, type: 'success', message: 'Updated!' });
    } catch (err: any) {
      setRowFeedback({ id: productId, type: 'error', message: err.response?.data?.message || 'Failed' });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setRowFeedback(null), 2500);
    }
  };

  const handleReturnAction = async (orderId: string, productId: string, action: 'approved' | 'rejected' | 'refunded') => {
    try {
      setUpdatingId(`${orderId}-${productId}`);
      await axios.patch(`${API_BASE}/orders/${orderId}/process-return`, { productId, action });
      await fetchReturns();
      setRowFeedback({ id: `${orderId}-${productId}`, type: 'success', message: `Processed as ${action}!` });
    } catch (err: any) {
      setRowFeedback({ id: `${orderId}-${productId}`, type: 'error', message: 'Failed' });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setRowFeedback(null), 2500);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sales Manager Dashboard</h1>
        <p className={styles.subtitle}>Manage pricing, track revenue, and view invoices.</p>
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'pricing' ? styles.tabActive : ''}`} onClick={() => setTab('pricing')}>
          Pricing & Discounts
        </button>
        <button className={`${styles.tab} ${tab === 'returns' ? styles.tabActive : ''}`} onClick={() => setTab('returns')}>
          Return Requests
        </button>
        <button className={`${styles.tab} ${tab === 'financials' ? styles.tabActive : ''}`} onClick={() => setTab('financials')}>
          Financial Reports
        </button>
        <button className={`${styles.tab} ${tab === 'invoices' ? styles.tabActive : ''}`} onClick={() => setTab('invoices')}>
          Invoice Log
        </button>
      </div>

      {tab === 'pricing' && (
        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Base Price ($)</th>
                  <th>Discount (%)</th>
                  <th>Final Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const draft = priceDrafts[p._id] || {};
                  const feedback = rowFeedback?.id === p._id ? rowFeedback : null;
                  return (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <input 
                          type="number" 
                          className={styles.numInput}
                          value={draft.basePrice ?? p.basePrice}
                          onChange={(e) => setPriceDrafts(prev => ({ ...prev, [p._id]: { ...draft, basePrice: e.target.value } }))}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={styles.numInput}
                          value={draft.discountRate ?? p.discountRate}
                          onChange={(e) => setPriceDrafts(prev => ({ ...prev, [p._id]: { ...draft, discountRate: e.target.value } }))}
                        />
                      </td>
                      <td>
                        <span className={styles.finalPrice}>${p.price.toFixed(2)}</span>
                      </td>
                      <td>
                        <button 
                          className={styles.saveButton}
                          disabled={updatingId === p._id}
                          onClick={() => handlePriceUpdate(p._id)}
                        >
                          {updatingId === p._id ? '...' : 'Update'}
                        </button>
                        {feedback && (
                          <span className={feedback.type === 'success' ? styles.successInline : styles.errorInline}>
                            {feedback.message}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'returns' && (
        <section className={styles.panel}>
          {retLoading ? <p>Loading returns...</p> : returnOrders.length === 0 ? (
            <p className={styles.muted}>No pending return requests.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Requested On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returnOrders.map(order => (
                    order.items.filter((i: any) => i.returnStatus === 'requested').map((item: any) => {
                      const feedback = rowFeedback?.id === `${order._id}-${item.product}` ? rowFeedback : null;
                      return (
                        <tr key={`${order._id}-${item.product}`}>
                          <td style={{ fontFamily: 'monospace' }}>#{order._id.slice(-8).toUpperCase()}</td>
                          <td>{order.customer?.name || 'Unknown'}</td>
                          <td>{item.name} (x{item.quantity})</td>
                          <td>{item.returnRequestedAt ? new Date(item.returnRequestedAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div className={styles.actions}>
                              <button 
                                className={styles.saveButton} 
                                onClick={() => handleReturnAction(order._id, item.product, 'refunded')}
                                disabled={updatingId === `${order._id}-${item.product}`}
                              >
                                Authorize Refund
                              </button>
                              <button 
                                className={styles.rejectButton} 
                                onClick={() => handleReturnAction(order._id, item.product, 'rejected')}
                                disabled={updatingId === `${order._id}-${item.product}`}
                              >
                                Reject
                              </button>
                              {feedback && (
                                <span className={feedback.type === 'success' ? styles.successInline : styles.errorInline}>
                                  {feedback.message}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'financials' && (
        <section className={styles.panel}>
          <div className={styles.dateFilter}>
            <div>
              <label>Start Date</label>
              <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label>End Date</label>
              <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className={styles.filterButton} onClick={fetchFinancials}>Apply Range</button>
          </div>

          {finLoading ? <p>Calculating stats...</p> : financials && (
            <div className={styles.finGrid}>
              <div className={styles.finCard}>
                <h3>Total Revenue</h3>
                <p className={styles.finValue}>${(financials.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
              <div className={styles.finCard}>
                <h3>Total Profit</h3>
                <p className={`${styles.finValue} ${(financials.totalProfit ?? 0) >= 0 ? styles.profit : styles.loss}`}>
                  ${(financials.totalProfit ?? 0).toLocaleString()}
                </p>
              </div>
              <div className={styles.finCard}>
                <h3>Total Orders</h3>
                <p className={styles.finValue}>{financials.count}</p>
              </div>
              <div className={styles.finCard}>
                <h3>Avg Order Value</h3>
                <p className={styles.finValue}>${(financials.averageOrderValue ?? 0).toFixed(2)}</p>
              </div>
              <div className={styles.finCard}>
                <h3>Profit Margin</h3>
                <p className={styles.finValue}>{(financials.profitMargin ?? 0).toFixed(1)}%</p>
              </div>
              <div className={styles.finCard}>
                <h3>Total Cost</h3>
                <p className={styles.finValue}>${(financials.totalCost ?? 0).toLocaleString()}</p>
              </div>

              <div className={styles.chartContainer}>
                <div className={styles.chartRow}>
                  <div className={styles.chartSection}>
                    <h3>Revenue vs. Profit</h3>
                    <div className={styles.barChart}>
                      <div className={styles.barGroup}>
                        <div className={styles.barRevenue} style={{ height: '80%' }}></div>
                        <label>Revenue</label>
                      </div>
                      <div className={styles.barGroup}>
                        <div 
                          className={styles.barProfit} 
                          style={{ 
                            height: (financials.totalRevenue ?? 0) > 0 
                              ? `${Math.max(0, ((financials.totalProfit ?? 0) / (financials.totalRevenue ?? 1)) * 80)}%` 
                              : '0%' 
                          }}
                        ></div>
                        <label>Profit</label>
                      </div>
                    </div>
                  </div>

                  <div className={styles.chartSection}>
                    <h3>Revenue by Category</h3>
                    <div className={styles.categoryList}>
                      {financials.categoryBreakdown && financials.categoryBreakdown.length > 0 ? (
                        financials.categoryBreakdown.map((cat, idx) => {
                          const maxVal = financials.categoryBreakdown[0]?.value || 1;
                          const percent = (cat.value / maxVal) * 100;
                          return (
                            <div key={cat.name} className={styles.categoryBarWrapper}>
                              <div className={styles.categoryLabel}>
                                <span>{cat.name}</span>
                                <span>${cat.value.toLocaleString()}</span>
                              </div>
                              <div className={styles.categoryBarBg}>
                                <div 
                                  className={styles.categoryBarFill} 
                                  style={{ 
                                    width: `${percent}%`,
                                    backgroundColor: `hsl(${idx * 40}, 60%, 50%)`
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className={styles.muted}>No category data available for this range.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'invoices' && (
        <section className={styles.panel}>
          <div className={styles.dateFilter}>
            <div>
              <label>From</label>
              <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label>To</label>
              <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className={styles.filterButton} onClick={fetchInvoices}>Filter Invoices</button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td>{inv.customer?.name || 'Unknown'}</td>
                    <td>${inv.totalAmount.toFixed(2)}</td>
                    <td>
                      <a 
                        href={`${API_BASE}/orders/invoice/${inv._id}/pdf`} 
                        target="_blank" 
                        rel="noreferrer"
                        className={styles.pdfLink}
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default SalesManagerDashboard;
