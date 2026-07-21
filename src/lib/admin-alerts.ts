import 'server-only';
import { supabaseAdmin } from './supabase-admin';

export type AdminAlertLevel = 'info' | 'warning' | 'error';

interface AdminAlertInput {
  title: string;
  body: string;
  orderRef?: string | null;
  level?: AdminAlertLevel;
  kind?: string;
}

interface AdminOrderEventInput {
  kind: 'order_created' | 'payment_confirmed' | 'order_cancelled';
  orderRef: string;
  amount?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status?: string | null;
}

let hasAlertsTableCache: boolean | null = null;

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

async function hasAlertsTable(): Promise<boolean> {
  if (hasAlertsTableCache !== null) return hasAlertsTableCache;
  const { error } = await supabaseAdmin
    .from('admin_alerts')
    .select('id', { head: true, count: 'exact' })
    .limit(1);
  hasAlertsTableCache = !error;
  return hasAlertsTableCache;
}

async function sendWebhookAlert(input: AdminAlertInput): Promise<void> {
  const webhookUrl = (process.env.ADMIN_ALERT_WEBHOOK_URL ?? '').trim();
  if (!webhookUrl) return;

  const text = `[${(input.level ?? 'info').toUpperCase()}] ${input.title}\n${input.body}`;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        title: input.title,
        body: input.body,
        level: input.level ?? 'info',
        orderRef: input.orderRef ?? null,
        kind: input.kind ?? 'general',
      }),
    });
  } catch (err) {
    console.error('[admin-alerts] webhook send failed:', err);
  }
}

export async function createAdminAlert(input: AdminAlertInput): Promise<void> {
  const row = {
    id: `al_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    kind: input.kind ?? 'general',
    level: input.level ?? 'info',
    title: input.title,
    body: input.body,
    order_ref: input.orderRef ?? null,
    is_read: false,
  };

  if (await hasAlertsTable()) {
    const { error } = await supabaseAdmin.from('admin_alerts').insert(row);
    if (error) {
      console.error('[admin-alerts] insert failed:', error.message);
    }
  }

  await sendWebhookAlert(input);
}

export async function notifyAdminOrderEvent(input: AdminOrderEventInput): Promise<void> {
  const amountText = typeof input.amount === 'number' ? `${input.amount.toLocaleString()} KRW` : '-';
  const customer = input.customerName ?? 'Unknown customer';
  const phone = normalizePhone(input.customerPhone);
  const status = input.status ?? '-';

  if (input.kind === 'order_created') {
    await createAdminAlert({
      kind: input.kind,
      level: 'info',
      title: 'New order received',
      orderRef: input.orderRef,
      body: `order=${input.orderRef} amount=${amountText} customer=${customer} phone=${phone ?? '-'} status=${status}`,
    });
    return;
  }

  if (input.kind === 'payment_confirmed') {
    await createAdminAlert({
      kind: input.kind,
      level: 'info',
      title: 'Payment confirmed',
      orderRef: input.orderRef,
      body: `order=${input.orderRef} amount=${amountText} customer=${customer} phone=${phone ?? '-'} status=${status}`,
    });
    return;
  }

  await createAdminAlert({
    kind: input.kind,
    level: 'warning',
    title: 'Order cancelled',
    orderRef: input.orderRef,
    body: `order=${input.orderRef} amount=${amountText} customer=${customer} phone=${phone ?? '-'} status=${status}`,
  });
}
