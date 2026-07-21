import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createAdminProduct } from '@/lib/admin-data';

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
      return false;
    }
  }
  return defaultValue;
}

function parseNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseList(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\n,]/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

async function parsePayload(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, unknown>;
  }

  const formData = await request.formData();
  const output: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    output[key] = typeof value === 'string' ? value : '';
  }
  return output;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await parsePayload(request);
  const price = parseNumber(payload.price);
  const originalPrice = parseNumber(payload.originalPrice);

  if (price === null) {
    return NextResponse.json({ error: 'price is required' }, { status: 400 });
  }

  try {
    const result = await createAdminProduct({
      name: String(payload.name ?? ''),
      nameEn: String(payload.nameEn ?? ''),
      slug: String(payload.slug ?? ''),
      categoryId: String(payload.categoryId ?? ''),
      price,
      originalPrice,
      description: String(payload.description ?? ''),
      details: String(payload.details ?? ''),
      sizes: parseList(payload.sizes),
      tags: parseList(payload.tags),
      collections: parseList(payload.collections),
      occasions: parseList(payload.occasions),
      floristId: String(payload.floristId ?? ''),
      inStock: parseBoolean(payload.inStock, true),
      isNew: parseBoolean(payload.isNew, true),
      isBest: parseBoolean(payload.isBest, false),
      imageUrl: String(payload.imageUrl ?? ''),
    });

    const wantsJson = (request.headers.get('content-type') ?? '').includes('application/json');
    if (wantsJson) {
      return NextResponse.json({ ok: true, product: result });
    }
    return NextResponse.redirect(new URL(`/admin/products/new?created=${encodeURIComponent(result.slug)}`, request.url), 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product.';
    console.error('[admin/products] create failed:', err);
    const wantsJson = (request.headers.get('content-type') ?? '').includes('application/json');
    if (wantsJson) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.redirect(new URL(`/admin/products/new?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
