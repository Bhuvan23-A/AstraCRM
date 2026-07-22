import { Account, Contact } from './crm';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  total: number;
  product?: Product;
}

export type QuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'expired'
  | 'accepted';

export interface Quotation {
  id: string;
  account_id: string;
  contact_id: string | null;
  quote_number: string;
  status: QuotationStatus;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string | null;
  terms_conditions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: QuotationItem[];
  account?: Account;
  contact?: Contact | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  product?: Product;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface Order {
  id: string;
  quotation_id: string | null;
  account_id: string;
  contact_id: string | null;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  account?: Account;
  contact?: Contact | null;
  quotation?: Quotation | null;
}

export interface QuotationItemPayload {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface QuotationCreatePayload {
  account_id: string;
  contact_id?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  tax_rate: number;
  valid_until?: string | null;
  terms_conditions?: string | null;
  notes?: string | null;
  items: QuotationItemPayload[];
}

export interface OrderCreatePayload {
  account_id: string;
  contact_id?: string | null;
  shipping_address?: string | null;
  billing_address?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  quotation_id?: string | null;
  items?: QuotationItemPayload[];
}
