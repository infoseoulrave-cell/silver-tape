import { getProductById } from '@/data/products';
import { calculatePrice, FRAME_OPTIONS, SIZE_OPTIONS } from '@/data/pricing';
import type { CartItem } from '@/types/cart';
import type { FrameColor } from '@/types/product';
import type { ShippingInfo } from '@/types/order';

const VALID_SIZE_IDS = new Set(SIZE_OPTIONS.map(size => size.id));
const VALID_FRAME_IDS = new Set(FRAME_OPTIONS.map(frame => frame.id));

const MAX_ITEMS_PER_ORDER = 30;
const MAX_QUANTITY_PER_ITEM = 10;

const SHIPPING_FREE_THRESHOLD = 50000;
const DEFAULT_SHIPPING_FEE = 3500;

interface RawCartItem {
  id?: unknown;
  productId?: unknown;
  productImage?: unknown;
  size?: unknown;
  frame?: unknown;
  artworkBg?: unknown;
  quantity?: unknown;
}

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  minLength = 1,
): string {
  if (typeof value !== 'string') {
    throw new RequestValidationError(`${fieldName} must be a string.`);
  }

  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw new RequestValidationError(`${fieldName} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`${fieldName} is too long.`);
  }

  return normalized;
}

function parseOptionalString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RequestValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function validateShippingInfo(rawShipping: unknown): ShippingInfo {
  if (!isRecord(rawShipping)) {
    throw new RequestValidationError('shipping is required.');
  }

  const name = parseRequiredString(rawShipping.name, 'shipping.name', 50);
  const phoneDigits = normalizePhoneNumber(
    parseRequiredString(rawShipping.phone, 'shipping.phone', 30),
  );
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    throw new RequestValidationError('shipping.phone is invalid.');
  }

  return {
    name,
    phone: phoneDigits,
    postalCode: parseRequiredString(rawShipping.postalCode, 'shipping.postalCode', 20),
    address: parseRequiredString(rawShipping.address, 'shipping.address', 200),
    addressDetail: parseOptionalString(rawShipping.addressDetail, 200),
    memo: parseOptionalString(rawShipping.memo, 500),
  };
}

function parseFrameColor(value: unknown, index: number): FrameColor {
  if (typeof value !== 'string' || !VALID_FRAME_IDS.has(value as FrameColor)) {
    throw new RequestValidationError(`items[${index}].frame is invalid.`);
  }
  return value as FrameColor;
}

function parseSizeId(value: unknown, index: number): string {
  if (typeof value !== 'string' || !VALID_SIZE_IDS.has(value)) {
    throw new RequestValidationError(`items[${index}].size is invalid.`);
  }
  return value;
}

function parseQuantity(value: unknown, index: number): number {
  const quantity = parsePositiveInteger(value, `items[${index}].quantity`);
  if (quantity > MAX_QUANTITY_PER_ITEM) {
    throw new RequestValidationError(
      `items[${index}].quantity exceeds max ${MAX_QUANTITY_PER_ITEM}.`,
    );
  }
  return quantity;
}

function sanitizeItemId(rawId: unknown, fallback: string): string {
  if (typeof rawId !== 'string') return fallback;
  const value = rawId.trim();
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(value)) return fallback;
  return value;
}

function sanitizeProductImage(rawImage: unknown, fallback: string): string {
  if (typeof rawImage !== 'string') return fallback;
  const value = rawImage.trim();
  if (value.length > 300) return fallback;
  if (!value.startsWith('/images/')) return fallback;
  return value;
}

export function buildTrustedCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) {
    throw new RequestValidationError('items must be an array.');
  }
  if (rawItems.length === 0) {
    throw new RequestValidationError('items cannot be empty.');
  }
  if (rawItems.length > MAX_ITEMS_PER_ORDER) {
    throw new RequestValidationError(`items exceeds max ${MAX_ITEMS_PER_ORDER}.`);
  }

  return rawItems.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      throw new RequestValidationError(`items[${index}] is invalid.`);
    }

    const item = rawItem as RawCartItem;
    const productId = parseRequiredString(item.productId, `items[${index}].productId`, 100);
    const product = getProductById(productId);
    if (!product) {
      throw new RequestValidationError(`items[${index}].productId is unknown.`);
    }

    const size = parseSizeId(item.size, index);
    const frame = parseFrameColor(item.frame, index);
    const quantity = parseQuantity(item.quantity, index);

    const hasFrame = frame !== 'none';
    const { printPrice, frameAddon } = calculatePrice(size, hasFrame);

    return {
      id: sanitizeItemId(item.id, `${product.id}-${size}-${frame}-${index + 1}`),
      productId: product.id,
      productTitle: product.title,
      productImage: sanitizeProductImage(item.productImage, product.image),
      studioId: product.studioId,
      studioName: product.artist,
      studioSlug: product.studioSlug,
      size,
      frame,
      artworkBg: parseOptionalString(item.artworkBg, 120),
      quantity,
      printPrice,
      framePrice: frameAddon,
    };
  });
}

export function calculateOrderTotals(items: CartItem[]): {
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.printPrice + item.framePrice) * item.quantity,
    0,
  );
  const shippingFee = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;

  return {
    subtotal,
    shippingFee,
    totalAmount: subtotal + shippingFee,
  };
}

export function extractClientIp(xForwardedFor: string | null): string | undefined {
  if (!xForwardedFor) return undefined;
  const first = xForwardedFor.split(',')[0]?.trim();
  if (!first) return undefined;
  return first.replace(/^::ffff:/, '');
}

export function validateOrderId(value: unknown): string {
  const orderId = parseRequiredString(value, 'orderId', 120);
  if (!/^[A-Za-z0-9_-]{4,120}$/.test(orderId)) {
    throw new RequestValidationError('orderId format is invalid.');
  }
  return orderId;
}

export function validatePaymentKey(value: unknown): string {
  const paymentKey = parseRequiredString(value, 'paymentKey', 220, 6);
  if (!/^[A-Za-z0-9_\-=+/.:]+$/.test(paymentKey)) {
    throw new RequestValidationError('paymentKey format is invalid.');
  }
  return paymentKey;
}

export function validateAmount(value: unknown): number {
  return parsePositiveInteger(value, 'amount');
}

export function isPaymentEnabled(): boolean {
  return process.env.PAYMENT_ENABLED === 'true';
}

