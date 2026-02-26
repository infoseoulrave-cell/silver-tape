import type { CartItem } from './cart';

export interface ShippingInfo {
  name: string;
  phone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  memo: string;
}

export interface Order {
  id: string;
  orderId: string;
  items: CartItem[];
  shipping: ShippingInfo;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentKey?: string;
  paymentMethod?: string;
  paidAt?: string;
  status: 'pending' | 'paid' | 'failed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  approvedAt: string;
  receipt?: { url: string };
  card?: {
    number: string;
    company: string;
    installmentPlanMonths: number;
  };
  easyPay?: {
    provider: string;
    amount: number;
  };
}
