import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getAdminDashboardSummary,
  listAdminAlerts,
  listAdminOrders,
} from '@/lib/admin-data';
import styles from './admin.module.css';

interface AdminPageProps {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
}

const STATUS_OPTIONS = [
  'pending',
  'paid',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
  'refunded',
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function compactPhone(value: string | null | undefined): string {
  if (!value) return '-';
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 8) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
}

function buildAddress(order: {
  zonecode: string | null;
  address: string | null;
  addressDetail: string | null;
}): string {
  const parts = [order.zonecode, order.address, order.addressDetail]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return '-';
  return parts.join(' ');
}

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({ searchParams }: AdminPageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?redirectTo=/admin');
  }

  const params = await searchParams;
  const [summary, orders, alerts] = await Promise.all([
    getAdminDashboardSummary(),
    listAdminOrders({ limit: 120 }),
    listAdminAlerts(25),
  ]);

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.badge}>ADMIN DASHBOARD</p>
          <h1 className={styles.title}>Orders, Visitors, and Product Control</h1>
          <p className={styles.subtitle}>
            Storage mode: <strong>{summary.storage}</strong> - Updated {formatDateTime(summary.generatedAt)}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.secondaryBtn} href="/rachel">
            Vendor Board
          </Link>
          <Link className={styles.secondaryBtn} href="/admin/products/new">
            New Product
          </Link>
          <form method="post" action="/api/admin/auth/logout">
            <input type="hidden" name="redirectTo" value="/admin/login" />
            <button className={styles.primaryBtn} type="submit">
              Sign Out
            </button>
          </form>
        </div>
      </section>

      {params.updated === '1' && (
        <p className={styles.success}>Order status updated.</p>
      )}
      {params.error && (
        <p className={styles.error}>Request failed: {params.error}</p>
      )}

      <section className={styles.kpis}>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Today Orders</p>
          <p className={styles.kpiValue}>{summary.ordersToday}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Pending</p>
          <p className={styles.kpiValue}>{summary.pendingOrders}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Revenue Today</p>
          <p className={styles.kpiValue}>{formatMoney(summary.revenueToday)} KRW</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Revenue 7D</p>
          <p className={styles.kpiValue}>{formatMoney(summary.revenue7d)} KRW</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Visitors 24H</p>
          <p className={styles.kpiValue}>{summary.visitors24h}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Visitors 7D</p>
          <p className={styles.kpiValue}>{summary.visitors7d}</p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panelWide}>
          <div className={styles.panelHeader}>
            <h2>Order List</h2>
            <p>{orders.length} rows</p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderPk}>
                    <td>
                      <strong>{order.orderRef}</strong>
                    </td>
                    <td>{order.customerName ?? '-'}</td>
                    <td>{compactPhone(order.customerPhone)}</td>
                    <td className={styles.addressCell}>{buildAddress(order)}</td>
                    <td>
                      {order.itemSummaries.length > 0
                        ? order.itemSummaries.join(', ')
                        : '-'}
                    </td>
                    <td>{formatMoney(order.totalAmount)}</td>
                    <td>
                      {(order.paymentStatus ?? '-')}
                      <br />
                      <span className={styles.subText}>{order.paymentMethod ?? '-'}</span>
                    </td>
                    <td>{order.status}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <form
                        method="post"
                        action={`/api/admin/orders/${encodeURIComponent(order.orderPk)}/status`}
                        className={styles.statusForm}
                      >
                        <input type="hidden" name="returnTo" value="/admin" />
                        <select name="status" defaultValue={order.status} className={styles.select}>
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={styles.smallBtn}>Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={10} className={styles.empty}>No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Top Viewed Pages</h2>
            <p>Last 7 days</p>
          </div>
          <ul className={styles.rankList}>
            {summary.topPages.map((page) => (
              <li key={page.path} className={styles.rankRow}>
                <div>
                  <p className={styles.rankPath}>{page.path}</p>
                  <p className={styles.subText}>{page.visitors} visitors</p>
                </div>
                <strong>{page.views}</strong>
              </li>
            ))}
            {summary.topPages.length === 0 && <li className={styles.empty}>No page view data yet.</li>}
          </ul>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Order Alerts</h2>
            <p>{alerts.length} recent</p>
          </div>
          <ul className={styles.alertList}>
            {alerts.map((alert) => (
              <li key={alert.id} className={styles.alertItem}>
                <p className={styles.alertTitle}>
                  [{alert.level}] {alert.title}
                </p>
                <p className={styles.alertBody}>{alert.body}</p>
                <p className={styles.subText}>{formatDateTime(alert.createdAt)}</p>
              </li>
            ))}
            {alerts.length === 0 && <li className={styles.empty}>No alerts yet.</li>}
          </ul>
        </article>
      </section>
    </main>
  );
}
