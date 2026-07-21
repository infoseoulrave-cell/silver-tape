import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedRole, isVendorAuthenticated } from '@/lib/admin-auth';
import { listAdminOrders } from '@/lib/admin-data';
import styles from './vendor.module.css';

interface VendorPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    updated?: string;
    error?: string;
  }>;
}

const OPEN_STATUSES = new Set(['pending', 'paid', 'preparing', 'shipping']);
const STATUS_FILTERS = ['all', 'open', 'pending', 'paid', 'preparing', 'shipping', 'delivered', 'cancelled'];

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
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
  return parts.length > 0 ? parts.join(' ') : '-';
}

function getNextVendorStatus(status: string): 'preparing' | 'shipping' | 'delivered' | null {
  const current = normalize(status);
  if (current === 'pending' || current === 'paid') return 'preparing';
  if (current === 'preparing') return 'shipping';
  if (current === 'shipping') return 'delivered';
  return null;
}

function getNextLabel(status: string): string {
  const next = getNextVendorStatus(status);
  if (!next) return 'No action';
  if (next === 'preparing') return 'Start Production';
  if (next === 'shipping') return 'Mark Shipping';
  return 'Mark Delivered';
}

function filterByStatus(statusFilter: string, status: string): boolean {
  const normalizedFilter = normalize(statusFilter);
  const normalizedStatus = normalize(status);

  if (!normalizedFilter || normalizedFilter === 'open') {
    return OPEN_STATUSES.has(normalizedStatus);
  }
  if (normalizedFilter === 'all') return true;
  return normalizedStatus === normalizedFilter;
}

export const dynamic = 'force-dynamic';

export default async function VendorPage({ searchParams }: VendorPageProps) {
  if (!(await isVendorAuthenticated())) {
    redirect('/rachel/login?redirectTo=/rachel');
  }

  const role = await getAuthenticatedRole();
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const statusFilter = STATUS_FILTERS.includes(normalize(params.status)) ? normalize(params.status) : 'open';

  const orders = await listAdminOrders({ limit: 300 });
  const filtered = orders.filter((order) => {
    const matchesStatus = filterByStatus(statusFilter, order.status);
    if (!matchesStatus) return false;
    if (!query) return true;

    const searchable = [
      order.orderRef,
      order.customerName ?? '',
      order.customerPhone ?? '',
      order.address ?? '',
      order.itemSummaries.join(' '),
    ].join(' ').toLowerCase();

    return searchable.includes(query);
  });

  const activeCount = orders.filter((order) => OPEN_STATUSES.has(normalize(order.status))).length;
  const preparingCount = orders.filter((order) => normalize(order.status) === 'preparing').length;
  const shippingCount = orders.filter((order) => normalize(order.status) === 'shipping').length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.badge}>RACHEL FLOWER BOARD</p>
          <h1 className={styles.title}>Production and Shipping Orders</h1>
          <p className={styles.subtitle}>
            Quick view for external production team. Updated orders: {filtered.length}
          </p>
        </div>

        <div className={styles.actions}>
          {role === 'admin' && (
            <Link className={styles.secondaryBtn} href="/admin">
              Open Admin
            </Link>
          )}
          <form method="post" action="/api/admin/auth/logout">
            <input type="hidden" name="redirectTo" value="/rachel/login" />
            <button className={styles.primaryBtn} type="submit">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {params.updated === '1' && (
        <p className={styles.success}>Order status updated.</p>
      )}
      {params.error && (
        <p className={styles.error}>Request failed: {params.error}</p>
      )}

      <section className={styles.metrics}>
        <article className={styles.metric}>
          <p>Open</p>
          <strong>{activeCount}</strong>
        </article>
        <article className={styles.metric}>
          <p>Preparing</p>
          <strong>{preparingCount}</strong>
        </article>
        <article className={styles.metric}>
          <p>Shipping</p>
          <strong>{shippingCount}</strong>
        </article>
      </section>

      <form className={styles.filters} method="get">
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search order / customer / phone"
          className={styles.search}
        />
        <select name="status" defaultValue={statusFilter} className={styles.select}>
          <option value="open">Open only</option>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="preparing">Preparing</option>
          <option value="shipping">Shipping</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className={styles.filterBtn} type="submit">
          Apply
        </button>
      </form>

      <section className={styles.list}>
        {filtered.map((order) => {
          const nextStatus = getNextVendorStatus(order.status);
          return (
            <article key={order.orderPk} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.orderRef}>{order.orderRef}</p>
                  <p className={styles.meta}>
                    {formatDateTime(order.createdAt)} · {order.status}
                  </p>
                </div>
                <p className={styles.amount}>{formatMoney(order.totalAmount)} KRW</p>
              </div>

              <dl className={styles.info}>
                <div>
                  <dt>Name</dt>
                  <dd>{order.customerName ?? '-'}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{compactPhone(order.customerPhone)}</dd>
                </div>
                <div className={styles.full}>
                  <dt>Address</dt>
                  <dd>{buildAddress(order)}</dd>
                </div>
                <div className={styles.full}>
                  <dt>Items</dt>
                  <dd>{order.itemSummaries.length > 0 ? order.itemSummaries.join(', ') : '-'}</dd>
                </div>
              </dl>

              <div className={styles.cardActions}>
                {nextStatus ? (
                  <form
                    method="post"
                    action={`/api/admin/orders/${encodeURIComponent(order.orderPk)}/status`}
                  >
                    <input type="hidden" name="status" value={nextStatus} />
                    <input type="hidden" name="returnTo" value="/rachel" />
                    <button className={styles.nextBtn} type="submit">
                      {getNextLabel(order.status)}
                    </button>
                  </form>
                ) : (
                  <span className={styles.done}>No pending step</span>
                )}

                <form
                  method="post"
                  action={`/api/admin/orders/${encodeURIComponent(order.orderPk)}/status`}
                  className={styles.manualForm}
                >
                  <input type="hidden" name="returnTo" value="/rachel" />
                  <select name="status" defaultValue={normalize(order.status)}>
                    <option value="preparing">preparing</option>
                    <option value="shipping">shipping</option>
                    <option value="delivered">delivered</option>
                  </select>
                  <button type="submit">Save</button>
                </form>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <p className={styles.empty}>No orders match this filter.</p>
        )}
      </section>
    </main>
  );
}
