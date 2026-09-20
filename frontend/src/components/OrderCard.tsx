import { useEffect, useRef, useState } from 'react';
import type { OrderPublic, OrderStatus } from '../types/order';
import { formatAge, STATUS_DOT, STATUS_LABEL } from '../utils/format';
import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  RECEIVED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'READY', label: 'Mark ready' },
  READY: { status: 'DELIVERED', label: 'Mark delivered' },
};

const ALL_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

export interface OrderCardProps {
  order: OrderPublic;
  now: number;
  busy?: boolean;
  /** Advance to the natural next status. */
  onAdvance?: (order: OrderPublic, next: OrderStatus) => void;
  onRetryConfirmation?: (order: OrderPublic) => void;
  onResendReady?: (order: OrderPublic) => void;
  onCancel?: (order: OrderPublic) => void;
  /** Force a status correction (reverse / arbitrary transition). */
  onForceStatus?: (order: OrderPublic, status: OrderStatus) => void;
  /** Hide the primary advance button (e.g. in delivered/search lists). */
  hideAdvance?: boolean;
  defaultExpanded?: boolean;
}

export function OrderCard({
  order,
  now,
  busy = false,
  onAdvance,
  onRetryConfirmation,
  onResendReady,
  onCancel,
  onForceStatus,
  hideAdvance = false,
  defaultExpanded = false,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const trackingUrl = `${window.location.origin}/track/${order.tracking_token}`;

  const handleCopyLink = async () => {
    const flagCopied = () => {
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(trackingUrl);
        flagCopied();
        return;
      }
    } catch {
      /* clipboard blocked or unavailable: fall through to manual copy */
    }
    // Fallback for browsers without the async clipboard API.
    window.prompt('Copy this tracking link:', trackingUrl);
  };

  const next = NEXT_STATUS[order.status];
  const confirmationFailed = order.confirmation_status === 'FAILED';
  const isActive =
    order.status === 'RECEIVED' ||
    order.status === 'PREPARING' ||
    order.status === 'READY';

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[order.status]}`} />
            <span className="font-display text-xl font-extrabold text-bean">
              {order.order_number}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-mocha">
            {order.customer_name} · {order.mobile_masked}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-mocha">Age</p>
          <p className="font-bold tabular-nums text-espresso">
            {formatAge(order.created_at, now)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-latte/60 px-3 py-2">
        <p className="text-sm font-semibold text-espresso">{order.items_display}</p>
        <p className="text-xs font-medium text-mocha">
          {order.quantity_total} item{order.quantity_total === 1 ? '' : 's'}
          {order.payment_method ? ` · ${order.payment_method}` : ''}
          {order.amount != null ? ` · ₹${order.amount}` : ''}
        </p>
      </div>

      {order.notes && (
        <p className="mt-2 rounded-xl border border-preparing/40 bg-preparing/10 px-3 py-2 text-sm text-espresso">
          <span className="font-bold">Note:</span> {order.notes}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="chip bg-latte text-espresso">{STATUS_LABEL[order.status]}</span>
        <WhatsAppStatusBadge status={order.confirmation_status} label="Conf" error={order.last_messaging_error} />
        {(order.status === 'READY' || order.ready_status !== 'NOT_SENT') && (
          <WhatsAppStatusBadge status={order.ready_status} label="Ready" error={order.last_messaging_error} />
        )}
      </div>

      {!hideAdvance && next && onAdvance && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAdvance(order, next.status)}
          className="btn btn-primary btn-lg mt-3 w-full"
        >
          {next.label}
        </button>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg px-2 py-1.5 text-sm font-semibold text-caramel hover:bg-latte"
        >
          {expanded ? 'Hide actions' : 'More actions'}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copy customer tracking link"
          className="rounded-lg px-2 py-1.5 text-sm font-semibold text-caramel hover:bg-latte"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-sand pt-3">
          {confirmationFailed && onRetryConfirmation && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRetryConfirmation(order)}
              className="btn btn-secondary w-full py-3"
            >
              Retry confirmation
            </button>
          )}

          {order.status === 'READY' && onResendReady && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onResendReady(order)}
              className="btn btn-secondary w-full py-3"
            >
              Resend ready message
            </button>
          )}

          {onForceStatus && (
            <label className="block">
              <span className="label">Correct status (forced)</span>
              <select
                className="field"
                value=""
                disabled={busy}
                onChange={(e) => {
                  const val = e.target.value as OrderStatus;
                  if (val) onForceStatus(order, val);
                  e.target.value = '';
                }}
              >
                <option value="">Choose status…</option>
                {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isActive && onCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(order)}
              className="btn btn-danger w-full py-3"
            >
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderCard;
