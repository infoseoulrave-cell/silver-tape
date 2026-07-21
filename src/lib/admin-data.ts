import 'server-only';
import { supabaseAdmin } from './supabase-admin';
import { createAdminAlert } from './admin-alerts';

type StorageKind = 'modern' | 'legacy';

interface ModernOrderRow {
  id: string;
  order_id: string;
  items: Array<Record<string, unknown>> | null;
  shipping: Record<string, unknown> | null;
  total_amount: number;
  payment_method: string | null;
  payment_key: string | null;
  paid_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LegacyOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  guestShippingRecipient: string | null;
  guestShippingPhone: string | null;
  guestShippingAddress: string | null;
  guestShippingAddressDetail: string | null;
  guestShippingZonecode: string | null;
}

interface LegacyPaymentRow {
  orderId: string;
  status: string;
  method: string | null;
  approvedAt: string | null;
  paymentKey: string | null;
  amount: number;
  createdAt: string;
}

interface LegacyOrderItemRow {
  orderId: string;
  productName: string;
  size: string;
  quantity: number;
}

interface PageViewRow {
  path: string;
  visitor_key: string;
  created_at: string;
}

interface AlertRow {
  id: string;
  kind: string;
  level: string;
  title: string;
  body: string;
  order_ref: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminOrderView {
  orderPk: string;
  orderRef: string;
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  address: string | null;
  addressDetail: string | null;
  zonecode: string | null;
  itemSummaries: string[];
}

export interface AdminTopPage {
  path: string;
  views: number;
  visitors: number;
}

export interface AdminAlertView {
  id: string;
  kind: string;
  level: string;
  title: string;
  body: string;
  orderRef: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboardSummary {
  storage: StorageKind;
  generatedAt: string;
  ordersToday: number;
  paidToday: number;
  pendingOrders: number;
  revenueToday: number;
  revenue7d: number;
  visitors24h: number;
  visitors7d: number;
  pageViews24h: number;
  topPages: AdminTopPage[];
}

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug?: string | null;
}

export interface AdminFloristOption {
  id: string;
  name: string;
  slug?: string | null;
}

export interface AdminProductInput {
  name: string;
  nameEn?: string;
  slug?: string;
  categoryId: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  details: string;
  sizes: string[];
  tags?: string[];
  collections?: string[];
  occasions?: string[];
  floristId?: string | null;
  inStock?: boolean;
  isNew?: boolean;
  isBest?: boolean;
  imageUrl?: string | null;
}

let storageKindCache: StorageKind | null = null;
let hasPageViewsTableCache: boolean | null = null;
let hasProductTableCache: boolean | null = null;
let hasCategoryTableCache: boolean | null = null;
let hasFloristTableCache: boolean | null = null;
let hasAdminProductsTableCache: boolean | null = null;
let hasAlertsTableCache: boolean | null = null;

function toKstDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function nowKstDateKey(): string {
  return toKstDateKey(new Date());
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatusInput(value: string): string {
  return value.trim().toLowerCase();
}

function mapStatusToModern(value: string): string {
  const v = normalizeStatusInput(value);
  if (v === 'ready') return 'pending';
  if (v === 'done') return 'paid';
  if (v === 'shipped') return 'shipped';
  if (v === 'shipping') return 'shipped';
  if (v === 'refunded') return 'cancelled';
  return v;
}

function mapStatusToLegacy(value: string): string {
  const v = normalizeStatusInput(value);
  if (v === 'pending' || v === 'ready') return 'PENDING';
  if (v === 'paid' || v === 'done') return 'PAID';
  if (v === 'preparing') return 'PREPARING';
  if (v === 'shipping' || v === 'shipped') return 'SHIPPING';
  if (v === 'delivered') return 'DELIVERED';
  if (v === 'cancelled' || v === 'canceled') return 'CANCELLED';
  if (v === 'refunded') return 'REFUNDED';
  return value.toUpperCase();
}

function mapLegacyOrderStatusToDisplay(value: string): string {
  const v = value.toUpperCase();
  if (v === 'PENDING') return 'pending';
  if (v === 'PAID') return 'paid';
  if (v === 'PREPARING') return 'preparing';
  if (v === 'SHIPPING') return 'shipping';
  if (v === 'DELIVERED') return 'delivered';
  if (v === 'CANCELLED') return 'cancelled';
  if (v === 'REFUNDED') return 'refunded';
  return value.toLowerCase();
}

function mapLegacyPaymentStatusForOrderStatus(orderStatus: string): string | null {
  const v = normalizeStatusInput(orderStatus);
  if (v === 'paid') return 'DONE';
  if (v === 'cancelled' || v === 'refunded') return 'CANCELLED';
  if (v === 'pending') return 'READY';
  return null;
}

function isPaidStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeStatusInput(status);
  return normalized === 'paid' || normalized === 'done';
}

async function tableExists(
  table: string,
  cacheRef: { value: boolean | null },
): Promise<boolean> {
  if (cacheRef.value !== null) return cacheRef.value;
  const { error } = await supabaseAdmin.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  cacheRef.value = !error;
  return cacheRef.value;
}

async function detectStorageKind(): Promise<StorageKind> {
  if (storageKindCache) return storageKindCache;

  const modern = await supabaseAdmin
    .from('orders')
    .select('order_id', { head: true, count: 'exact' })
    .limit(1);
  if (!modern.error) {
    storageKindCache = 'modern';
    return storageKindCache;
  }

  const legacy = await supabaseAdmin
    .from('Order')
    .select('id', { head: true, count: 'exact' })
    .limit(1);
  if (!legacy.error) {
    storageKindCache = 'legacy';
    return storageKindCache;
  }

  throw new Error(
    `Unable to detect order storage schema. modern=${modern.error?.message ?? 'unknown'} legacy=${legacy.error?.message ?? 'unknown'}`,
  );
}

function buildModernItemSummaries(items: Array<Record<string, unknown>> | null): string[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 5).map((item) => {
    const title = String(item.productTitle ?? item.productId ?? 'item');
    const quantity = safeNumber(item.quantity) || 1;
    return `${title} x${quantity}`;
  });
}

function summarizeLegacyItems(items: LegacyOrderItemRow[] | undefined): string[] {
  if (!items || items.length === 0) return [];
  return items.slice(0, 5).map((item) => `${item.productName} x${item.quantity} (${item.size})`);
}

async function listModernOrders(limit: number, status?: string): Promise<AdminOrderView[]> {
  let query = supabaseAdmin
    .from('orders')
    .select('id,order_id,items,shipping,total_amount,payment_method,payment_key,paid_at,status,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', mapStatusToModern(status));
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load orders: ${error.message}`);

  return ((data ?? []) as ModernOrderRow[]).map((row) => {
    const shipping = row.shipping ?? {};
    return {
      orderPk: row.order_id,
      orderRef: row.order_id,
      status: row.status,
      paymentStatus: row.status === 'paid' ? 'DONE' : null,
      paymentMethod: row.payment_method,
      totalAmount: safeNumber(row.total_amount),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      paidAt: row.paid_at,
      customerName: typeof shipping.name === 'string' ? shipping.name : null,
      customerPhone: typeof shipping.phone === 'string' ? shipping.phone : null,
      address: typeof shipping.address === 'string' ? shipping.address : null,
      addressDetail: typeof shipping.addressDetail === 'string' ? shipping.addressDetail : null,
      zonecode: typeof shipping.zonecode === 'string' ? shipping.zonecode : null,
      itemSummaries: buildModernItemSummaries(row.items),
    };
  });
}

async function listLegacyOrders(limit: number, status?: string): Promise<AdminOrderView[]> {
  let orderQuery = supabaseAdmin
    .from('Order')
    .select('id,orderNumber,status,totalAmount,createdAt,updatedAt,guestShippingRecipient,guestShippingPhone,guestShippingAddress,guestShippingAddressDetail,guestShippingZonecode')
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (status) {
    orderQuery = orderQuery.eq('status', mapStatusToLegacy(status));
  }

  const { data: orderRows, error: orderError } = await orderQuery;
  if (orderError) throw new Error(`Failed to load legacy orders: ${orderError.message}`);

  const orders = (orderRows ?? []) as LegacyOrderRow[];
  if (orders.length === 0) return [];

  const orderIds = orders.map((row) => row.id);

  const [{ data: paymentRows, error: paymentError }, { data: itemRows, error: itemError }] = await Promise.all([
    supabaseAdmin
      .from('Payment')
      .select('orderId,status,method,approvedAt,paymentKey,amount,createdAt')
      .in('orderId', orderIds)
      .order('createdAt', { ascending: false }),
    supabaseAdmin
      .from('OrderItem')
      .select('orderId,productName,size,quantity')
      .in('orderId', orderIds),
  ]);

  if (paymentError) throw new Error(`Failed to load payments: ${paymentError.message}`);
  if (itemError) throw new Error(`Failed to load order items: ${itemError.message}`);

  const latestPaymentByOrder = new Map<string, LegacyPaymentRow>();
  for (const payment of (paymentRows ?? []) as LegacyPaymentRow[]) {
    if (!latestPaymentByOrder.has(payment.orderId)) {
      latestPaymentByOrder.set(payment.orderId, payment);
    }
  }

  const itemsByOrder = new Map<string, LegacyOrderItemRow[]>();
  for (const item of (itemRows ?? []) as LegacyOrderItemRow[]) {
    const arr = itemsByOrder.get(item.orderId);
    if (arr) {
      arr.push(item);
    } else {
      itemsByOrder.set(item.orderId, [item]);
    }
  }

  return orders.map((order) => {
    const payment = latestPaymentByOrder.get(order.id);
    return {
      orderPk: order.id,
      orderRef: order.orderNumber,
      status: mapLegacyOrderStatusToDisplay(order.status),
      paymentStatus: payment?.status ?? null,
      paymentMethod: payment?.method ?? null,
      totalAmount: safeNumber(payment?.amount ?? order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: payment?.approvedAt ?? null,
      customerName: order.guestShippingRecipient,
      customerPhone: order.guestShippingPhone,
      address: order.guestShippingAddress,
      addressDetail: order.guestShippingAddressDetail,
      zonecode: order.guestShippingZonecode,
      itemSummaries: summarizeLegacyItems(itemsByOrder.get(order.id)),
    };
  });
}

export async function listAdminOrders(options?: {
  limit?: number;
  status?: string;
}): Promise<AdminOrderView[]> {
  const kind = await detectStorageKind();
  const limit = Math.max(1, Math.min(500, options?.limit ?? 100));

  if (kind === 'modern') {
    return listModernOrders(limit, options?.status);
  }
  return listLegacyOrders(limit, options?.status);
}

async function listPageViews(days: number): Promise<PageViewRow[]> {
  const exists = await tableExists('page_views', { value: hasPageViewsTableCache });
  hasPageViewsTableCache = exists;
  if (!exists) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('page_views')
    .select('path,visitor_key,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);

  if (error) {
    console.error('[admin-data] Failed to load page views:', error.message);
    return [];
  }

  return (data ?? []) as PageViewRow[];
}

function computeTopPages(pageViews: PageViewRow[]): AdminTopPage[] {
  const byPath = new Map<string, { views: number; visitors: Set<string> }>();
  for (const row of pageViews) {
    const normalizedPath = row.path || '/';
    let current = byPath.get(normalizedPath);
    if (!current) {
      current = { views: 0, visitors: new Set<string>() };
      byPath.set(normalizedPath, current);
    }
    current.views += 1;
    current.visitors.add(row.visitor_key);
  }

  return Array.from(byPath.entries())
    .map(([path, metric]) => ({
      path,
      views: metric.views,
      visitors: metric.visitors.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [storage, orders, pageViews] = await Promise.all([
    detectStorageKind(),
    listAdminOrders({ limit: 500 }),
    listPageViews(7),
  ]);

  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last7d = now - 7 * 24 * 60 * 60 * 1000;

  const todayKey = nowKstDateKey();
  let ordersToday = 0;
  let paidToday = 0;
  let pendingOrders = 0;
  let revenueToday = 0;
  let revenue7d = 0;

  for (const order of orders) {
    if (toKstDateKey(order.createdAt) === todayKey) {
      ordersToday += 1;
    }
    if (normalizeStatusInput(order.status) === 'pending') {
      pendingOrders += 1;
    }

    const paidReference = order.paidAt ?? order.updatedAt ?? order.createdAt;
    const paidTime = new Date(paidReference).getTime();
    const paid = isPaidStatus(order.paymentStatus) || isPaidStatus(order.status);
    if (paid && Number.isFinite(paidTime)) {
      if (toKstDateKey(paidReference) === todayKey) {
        paidToday += 1;
        revenueToday += order.totalAmount;
      }
      if (paidTime >= last7d) {
        revenue7d += order.totalAmount;
      }
    }
  }

  const visitors24 = new Set<string>();
  const visitors7 = new Set<string>();
  let pageViews24h = 0;

  for (const row of pageViews) {
    const ts = new Date(row.created_at).getTime();
    visitors7.add(row.visitor_key);
    if (ts >= last24h) {
      visitors24.add(row.visitor_key);
      pageViews24h += 1;
    }
  }

  return {
    storage,
    generatedAt: new Date().toISOString(),
    ordersToday,
    paidToday,
    pendingOrders,
    revenueToday,
    revenue7d,
    visitors24h: visitors24.size,
    visitors7d: visitors7.size,
    pageViews24h,
    topPages: computeTopPages(pageViews),
  };
}

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  visitorKey: string;
  userAgent?: string | null;
  ipHash?: string | null;
}): Promise<void> {
  const exists = await tableExists('page_views', { value: hasPageViewsTableCache });
  hasPageViewsTableCache = exists;
  if (!exists) return;

  const path = input.path.slice(0, 400) || '/';
  const referrer = (input.referrer ?? '').slice(0, 1000) || null;
  const userAgent = (input.userAgent ?? '').slice(0, 500) || null;
  const ipHash = (input.ipHash ?? '').slice(0, 120) || null;

  const { error } = await supabaseAdmin.from('page_views').insert({
    path,
    referrer,
    visitor_key: input.visitorKey,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[admin-data] Failed to save page view:', error.message);
  }
}

export async function listAdminAlerts(limit = 20): Promise<AdminAlertView[]> {
  const exists = await tableExists('admin_alerts', { value: hasAlertsTableCache });
  hasAlertsTableCache = exists;
  if (!exists) return [];

  const { data, error } = await supabaseAdmin
    .from('admin_alerts')
    .select('id,kind,level,title,body,order_ref,is_read,created_at')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 200)));

  if (error) throw new Error(`Failed to load admin alerts: ${error.message}`);

  return ((data ?? []) as AlertRow[]).map((row) => ({
    id: row.id,
    kind: row.kind,
    level: row.level,
    title: row.title,
    body: row.body,
    orderRef: row.order_ref,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function updateAdminOrderStatus(orderPk: string, status: string): Promise<void> {
  const kind = await detectStorageKind();

  if (kind === 'modern') {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: mapStatusToModern(status) })
      .eq('order_id', orderPk);
    if (error) throw new Error(`Failed to update order status: ${error.message}`);

    await createAdminAlert({
      kind: 'status_changed',
      title: 'Order status updated',
      body: `order=${orderPk} status=${mapStatusToModern(status)}`,
      orderRef: orderPk,
      level: 'info',
    });
    return;
  }

  const legacyStatus = mapStatusToLegacy(status);
  const { error: orderError } = await supabaseAdmin
    .from('Order')
    .update({ status: legacyStatus })
    .eq('id', orderPk);
  if (orderError) throw new Error(`Failed to update legacy order status: ${orderError.message}`);

  const paymentStatus = mapLegacyPaymentStatusForOrderStatus(status);
  if (paymentStatus) {
    const { error: paymentError } = await supabaseAdmin
      .from('Payment')
      .update({ status: paymentStatus })
      .eq('orderId', orderPk);
    if (paymentError) {
      console.error('[admin-data] Failed to sync payment status:', paymentError.message);
    }
  }

  await createAdminAlert({
    kind: 'status_changed',
    title: 'Order status updated',
    body: `orderPk=${orderPk} status=${legacyStatus}`,
    orderRef: orderPk,
    level: 'info',
  });
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeStringArray(values: string[] | undefined): string[] {
  if (!values) return [];
  return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

async function nextProductSortOrder(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('Product')
    .select('sortOrder')
    .order('sortOrder', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[admin-data] Failed to load next sort order:', error.message);
    return 1;
  }

  return safeNumber((data as { sortOrder?: unknown } | null)?.sortOrder) + 1;
}

async function hasProductTable(): Promise<boolean> {
  const exists = await tableExists('Product', { value: hasProductTableCache });
  hasProductTableCache = exists;
  return exists;
}

async function hasCategoryTable(): Promise<boolean> {
  const exists = await tableExists('Category', { value: hasCategoryTableCache });
  hasCategoryTableCache = exists;
  return exists;
}

async function hasFloristTable(): Promise<boolean> {
  const exists = await tableExists('Florist', { value: hasFloristTableCache });
  hasFloristTableCache = exists;
  return exists;
}

async function hasAdminProductsTable(): Promise<boolean> {
  const exists = await tableExists('admin_products', { value: hasAdminProductsTableCache });
  hasAdminProductsTableCache = exists;
  return exists;
}

export async function listCategoryOptions(): Promise<AdminCategoryOption[]> {
  if (!(await hasCategoryTable())) return [];

  const { data, error } = await supabaseAdmin
    .from('Category')
    .select('id,name,slug')
    .order('sortOrder', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[admin-data] Failed to load categories:', error.message);
    return [];
  }

  return (data ?? []) as AdminCategoryOption[];
}

export async function listFloristOptions(): Promise<AdminFloristOption[]> {
  if (!(await hasFloristTable())) return [];

  const { data, error } = await supabaseAdmin
    .from('Florist')
    .select('id,name,slug')
    .eq('isActive', true)
    .order('sortOrder', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[admin-data] Failed to load florists:', error.message);
    return [];
  }

  return (data ?? []) as AdminFloristOption[];
}

export async function createAdminProduct(input: AdminProductInput): Promise<{ id: string; slug: string }> {
  const normalizedName = input.name.trim();
  const normalizedCategoryId = input.categoryId.trim();
  const normalizedDescription = input.description.trim();
  const normalizedDetails = input.details.trim();
  const normalizedSizes = normalizeStringArray(input.sizes);

  if (!normalizedName) throw new Error('name is required');
  if (!normalizedCategoryId) throw new Error('categoryId is required');
  if (!normalizedDescription) throw new Error('description is required');
  if (!normalizedDetails) throw new Error('details is required');
  if (normalizedSizes.length === 0) throw new Error('At least one size option is required');
  if (!Number.isFinite(input.price) || input.price <= 0) throw new Error('price must be a positive number');

  const slug = slugify(input.slug?.trim() || normalizedName);
  if (!slug) throw new Error('Failed to generate slug');

  if (await hasProductTable()) {
    const id = `prd_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const sortOrder = await nextProductSortOrder();
    const tags = normalizeStringArray(input.tags);
    const collections = normalizeStringArray(input.collections);
    const occasions = normalizeStringArray(input.occasions);

    const payload = {
      id,
      slug,
      name: normalizedName,
      nameEn: input.nameEn?.trim() || normalizedName,
      price: Math.round(input.price),
      originalPrice:
        input.originalPrice && Number.isFinite(input.originalPrice)
          ? Math.round(input.originalPrice)
          : null,
      categoryId: normalizedCategoryId,
      sizes: normalizedSizes,
      description: normalizedDescription,
      details: normalizedDetails,
      tags: tags.length > 0 ? tags : null,
      collections: collections.length > 0 ? collections : null,
      occasions: occasions.length > 0 ? occasions : null,
      inStock: input.inStock ?? true,
      isNew: input.isNew ?? true,
      isBest: input.isBest ?? false,
      sortOrder,
      floristId: input.floristId?.trim() || null,
      priceRange: null,
    };

    const { error } = await supabaseAdmin.from('Product').insert(payload);
    if (error) throw new Error(`Failed to create Product row: ${error.message}`);

    const imageUrl = input.imageUrl?.trim() || '';
    if (imageUrl) {
      const { error: imageError } = await supabaseAdmin.from('ProductImage').insert({
        id: `img_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        productId: id,
        url: imageUrl,
        alt: normalizedName,
        sortOrder: 0,
        isPrimary: true,
      });
      if (imageError) {
        console.error('[admin-data] Product image insert failed:', imageError.message);
      }
    }

    await createAdminAlert({
      kind: 'product_created',
      level: 'info',
      title: 'Product created',
      body: `product=${normalizedName} slug=${slug} price=${Math.round(input.price)}`,
    });

    return { id, slug };
  }

  if (await hasAdminProductsTable()) {
    const id = `prd_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const { error } = await supabaseAdmin.from('admin_products').insert({
      id,
      slug,
      name: normalizedName,
      name_en: input.nameEn?.trim() || normalizedName,
      category_id: normalizedCategoryId,
      price: Math.round(input.price),
      original_price:
        input.originalPrice && Number.isFinite(input.originalPrice)
          ? Math.round(input.originalPrice)
          : null,
      description: normalizedDescription,
      details: normalizedDetails,
      sizes: normalizedSizes,
      tags: normalizeStringArray(input.tags),
      collections: normalizeStringArray(input.collections),
      occasions: normalizeStringArray(input.occasions),
      florist_id: input.floristId?.trim() || null,
      in_stock: input.inStock ?? true,
      is_new: input.isNew ?? true,
      is_best: input.isBest ?? false,
      image_url: input.imageUrl?.trim() || null,
    });
    if (error) throw new Error(`Failed to create admin_products row: ${error.message}`);

    await createAdminAlert({
      kind: 'product_created',
      level: 'info',
      title: 'Product draft created',
      body: `product=${normalizedName} slug=${slug} price=${Math.round(input.price)} (admin_products fallback)`,
    });

    return { id, slug };
  }

  throw new Error(
    'No product table found. Create public.Product table or apply migration for public.admin_products.',
  );
}
