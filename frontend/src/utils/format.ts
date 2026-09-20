import type { OrderStatus } from '../types/order';

/** Human-friendly elapsed time since an ISO timestamp, e.g. "3m 12s". */
export function formatAge(fromIso: string, nowMs: number): string {
  const start = new Date(fromIso).getTime();
  if (Number.isNaN(start)) return '--';
  let secs = Math.max(0, Math.floor((nowMs - start) / 1000));
  const hrs = Math.floor(secs / 3600);
  secs -= hrs * 3600;
  const mins = Math.floor(secs / 60);
  secs -= mins * 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/** Short clock time, e.g. "14:05:22". */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: 'Received',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  RECEIVED: 'bg-received',
  PREPARING: 'bg-preparing',
  READY: 'bg-ready',
  DELIVERED: 'bg-delivered',
  CANCELLED: 'bg-cancelled',
};
