import { supabaseAdmin } from './supabase-admin';
import type { Order } from '@/types/order';

// DB row → Order type mapping
interface OrderRow {
  id: string;
  order_id: string;
  items: Order['items'];
  shipping: Order['shipping'];
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_key: string | null;
  payment_method: string | null;
  paid_at: string | null;
  status: Order['status'];
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderId: row.order_id,
    items: row.items,
    shipping: row.shipping,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    totalAmount: row.total_amount,
    paymentKey: row.payment_key ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paidAt: row.paid_at ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveOrder(order: Order): Promise<void> {
  const { error } = await supabaseAdmin.from('orders').insert({
    order_id: order.orderId,
    items: order.items,
    shipping: order.shipping,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total_amount: order.totalAmount,
    status: order.status,
  });

  if (error) throw new Error(`Failed to save order: ${error.message}`);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !data) return null;
  return rowToOrder(data as OrderRow);
}

export async function updateOrder(
  orderId: string,
  updates: Partial<Order>,
  /** If set, only update when current status matches (atomic compare-and-swap) */
  expectedStatus?: Order['status'],
): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.paymentKey !== undefined) dbUpdates.payment_key = updates.paymentKey;
  if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
  if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;

  let query = supabaseAdmin
    .from('orders')
    .update(dbUpdates)
    .eq('order_id', orderId);

  if (expectedStatus !== undefined) {
    query = query.eq('status', expectedStatus);
  }

  const { data, error } = await query.select('order_id');

  if (error) throw new Error(`Failed to update order ${orderId}: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

// Admin: list orders with filtering/pagination
export async function listOrders(options?: {
  status?: Order['status'];
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; count: number }> {
  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list orders: ${error.message}`);

  return {
    orders: (data as OrderRow[]).map(rowToOrder),
    count: count ?? 0,
  };
}
