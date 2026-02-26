import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type { Order } from '@/types/order';

const ORDERS_DIR = process.env.ORDER_STORAGE_DIR
  ?? (process.env.VERCEL
    ? path.join(os.tmpdir(), 'silvertape-orders')
    : path.join(process.cwd(), 'data', 'orders'));

async function ensureDir() {
  await fs.mkdir(ORDERS_DIR, { recursive: true });
}

function orderPath(orderId: string): string {
  const safe = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(ORDERS_DIR, `${safe}.json`);
}

export async function saveOrder(order: Order): Promise<void> {
  await ensureDir();
  await fs.writeFile(orderPath(order.orderId), JSON.stringify(order, null, 2), 'utf-8');
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const data = await fs.readFile(orderPath(orderId), 'utf-8');
    return JSON.parse(data) as Order;
  } catch {
    return null;
  }
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  const updated: Order = {
    ...order,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveOrder(updated);
  return updated;
}
