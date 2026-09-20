// Mirrors the backend API contract for the Bean Tradition ordering system.

export type OrderStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type MessageStatus =
  | 'NOT_SENT'
  | 'SEND_PENDING'
  | 'SENT'
  | 'FAILED'
  | 'DELIVERED'
  | 'READ';

export type PaymentMethod = 'UPI' | 'Cash';

export interface OrderItem {
  product: string;
  quantity: number;
}

export interface OrderPublic {
  order_id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  mobile_masked: string;
  items: OrderItem[];
  items_display: string;
  quantity_total: number;
  notes: string;
  amount: number | null;
  payment_method: string;
  status: OrderStatus;
  confirmation_status: MessageStatus;
  ready_status: MessageStatus;
  ready_at: string | null;
  delivered_at: string | null;
  created_by: string;
  last_messaging_error: string | null;
}

export interface CreateOrderRequest {
  customer_name: string;
  mobile: string;
  items: OrderItem[];
  notes: string;
  amount: number | null;
  payment_method: string;
  created_by: string;
  idempotency_key: string;
}

export interface WhatsAppResult {
  confirmation_sent: boolean;
  meta_message_id: string | null;
  error: string | null;
}

export interface CreatedOrder {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  tracking_url: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order_created: boolean;
  order: CreatedOrder;
  whatsapp: WhatsAppResult;
}

export interface OrdersListResponse {
  orders: OrderPublic[];
  server_time: string;
}

export interface MessageActionResponse {
  success: boolean;
  message_status: MessageStatus;
  meta_message_id: string | null;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
}

export interface AuthMeResponse {
  authenticated: boolean;
  subject?: string;
}

export interface TrackMyOrder {
  order_number: string;
  status: OrderStatus;
  items_display: string;
}

export interface TrackResponse {
  my_order: TrackMyOrder;
  ready_orders: string[];
  preparing_orders: string[];
  server_time: string;
}

export interface OrderSearchParams {
  order_number?: string;
  mobile_last4?: string;
}
