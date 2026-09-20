import type {
  AuthMeResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  LoginResponse,
  MessageActionResponse,
  OrderPublic,
  OrderSearchParams,
  OrderStatus,
  OrdersListResponse,
  TrackResponse,
} from '../types/order';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

/**
 * Error thrown for any non-2xx response. `detail` carries the backend's
 * `{detail}` message when present so the UI can show it directly.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;
  readonly body: unknown;

  constructor(status: number, message: string, detail: string | null, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Status codes that should be returned (parsed) instead of throwing. */
  allowStatuses?: number[];
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, allowStatuses = [] } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal,
    });
  } catch (err) {
    // Network / CORS / offline failure.
    throw new ApiError(0, 'Network request failed', null, err);
  }

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (res.ok || allowStatuses.includes(res.status)) {
    return data as T;
  }

  const detail = extractDetail(data);
  throw new ApiError(res.status, detail ?? `Request failed (${res.status})`, detail, data);
}

function extractDetail(data: unknown): string | null {
  if (data && typeof data === 'object' && 'detail' in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d.length > 0) {
      // FastAPI validation error array.
      const first = d[0] as { msg?: string };
      if (first && typeof first.msg === 'string') return first.msg;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export function login(password: string): Promise<LoginResponse> {
  // 401 returns {success:false}; treat it as a valid, non-throwing result.
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { password },
    allowStatuses: [401],
  });
}

export function logout(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function getMe(signal?: AbortSignal): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/api/auth/me', { signal });
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    body: payload,
  });
}

export function getActiveOrders(signal?: AbortSignal): Promise<OrdersListResponse> {
  return request<OrdersListResponse>('/api/orders/active', { signal });
}

export function getDeliveredOrders(limit = 20, signal?: AbortSignal): Promise<OrdersListResponse> {
  return request<OrdersListResponse>(`/api/orders/delivered?limit=${limit}`, { signal });
}

export function searchOrders(
  params: OrderSearchParams,
  signal?: AbortSignal,
): Promise<OrdersListResponse> {
  const qs = new URLSearchParams();
  if (params.order_number) qs.set('order_number', params.order_number);
  if (params.mobile_last4) qs.set('mobile_last4', params.mobile_last4);
  return request<OrdersListResponse>(`/api/orders/search?${qs.toString()}`, { signal });
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  force = false,
): Promise<OrderPublic> {
  return request<OrderPublic>(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: force ? { status, force: true } : { status },
  });
}

export function resendReady(orderId: string): Promise<MessageActionResponse> {
  return request<MessageActionResponse>(`/api/orders/${orderId}/resend-ready`, {
    method: 'POST',
  });
}

export function retryConfirmation(orderId: string): Promise<MessageActionResponse> {
  return request<MessageActionResponse>(`/api/orders/${orderId}/retry-confirmation`, {
    method: 'POST',
  });
}

export function cancelOrder(orderId: string): Promise<OrderPublic> {
  return request<OrderPublic>(`/api/orders/${orderId}/cancel`, { method: 'POST' });
}

/* ------------------------------------------------------------------ */
/* Tracking (public)                                                   */
/* ------------------------------------------------------------------ */

export function getTracking(token: string, signal?: AbortSignal): Promise<TrackResponse> {
  return request<TrackResponse>(`/api/track/${encodeURIComponent(token)}`, { signal });
}

export { API_BASE_URL };
