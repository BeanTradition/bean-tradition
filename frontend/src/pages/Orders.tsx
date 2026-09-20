import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  cancelOrder,
  getDeliveredOrders,
  resendReady,
  retryConfirmation,
  searchOrders,
  updateOrderStatus,
} from '../services/api';
import type { OrderPublic, OrderStatus } from '../types/order';
import { useOrderPolling } from '../hooks/useOrderPolling';
import { StaffNav } from '../components/StaffNav';
import { StatusColumn } from '../components/StatusColumn';
import { OrderCard } from '../components/OrderCard';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { BrandWatermark } from '../components/BrandWatermark';

const BOARD_COLUMNS: OrderStatus[] = ['RECEIVED', 'PREPARING', 'READY'];

export function Orders() {
  const { orders, lastUpdated, connection, refetch } = useOrderPolling();
  const [now, setNow] = useState(() => Date.now());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Live clock for order ages.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const setBusy = useCallback((id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const withBusy = useCallback(
    async (id: string, fn: () => Promise<void>) => {
      setBusy(id, true);
      try {
        await fn();
      } finally {
        setBusy(id, false);
      }
    },
    [setBusy],
  );

  const advance = useCallback(
    (order: OrderPublic, next: OrderStatus) =>
      withBusy(order.order_id, async () => {
        try {
          await updateOrderStatus(order.order_id, next);
          await refetch();
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const force = window.confirm(
              `${err.detail ?? 'Invalid transition.'}\n\nForce this change anyway?`,
            );
            if (force) {
              await updateOrderStatus(order.order_id, next, true);
              await refetch();
            }
          } else {
            setToast(err instanceof ApiError ? err.message : 'Could not update status.');
          }
        }
      }),
    [refetch, withBusy],
  );

  const forceStatus = useCallback(
    (order: OrderPublic, status: OrderStatus) =>
      withBusy(order.order_id, async () => {
        const ok = window.confirm(
          `Force ${order.order_number} to ${status}? This overrides normal flow.`,
        );
        if (!ok) return;
        try {
          await updateOrderStatus(order.order_id, status, true);
          await refetch();
          setToast(`${order.order_number} set to ${status}.`);
        } catch (err) {
          setToast(err instanceof ApiError ? err.message : 'Could not correct status.');
        }
      }),
    [refetch, withBusy],
  );

  const doCancel = useCallback(
    (order: OrderPublic) =>
      withBusy(order.order_id, async () => {
        const ok = window.confirm(`Cancel order ${order.order_number}?`);
        if (!ok) return;
        try {
          await cancelOrder(order.order_id);
          await refetch();
          setToast(`${order.order_number} cancelled.`);
        } catch (err) {
          setToast(err instanceof ApiError ? err.message : 'Could not cancel order.');
        }
      }),
    [refetch, withBusy],
  );

  const doRetryConfirmation = useCallback(
    (order: OrderPublic) =>
      withBusy(order.order_id, async () => {
        try {
          const res = await retryConfirmation(order.order_id);
          await refetch();
          setToast(
            res.success
              ? `Confirmation resent for ${order.order_number}.`
              : `Retry failed: ${res.error ?? 'unknown error'}`,
          );
        } catch (err) {
          setToast(err instanceof ApiError ? err.message : 'Could not retry confirmation.');
        }
      }),
    [refetch, withBusy],
  );

  const doResendReady = useCallback(
    (order: OrderPublic) =>
      withBusy(order.order_id, async () => {
        try {
          const res = await resendReady(order.order_id);
          await refetch();
          setToast(
            res.success
              ? `Ready message resent for ${order.order_number}.`
              : `Resend failed: ${res.error ?? 'unknown error'}`,
          );
        } catch (err) {
          setToast(err instanceof ApiError ? err.message : 'Could not resend ready message.');
        }
      }),
    [refetch, withBusy],
  );

  const ordersByStatus = useMemo(() => {
    const map: Record<OrderStatus, OrderPublic[]> = {
      RECEIVED: [],
      PREPARING: [],
      READY: [],
      DELIVERED: [],
      CANCELLED: [],
    };
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [orders]);

  const cardHandlers = {
    now,
    busyIds,
    onAdvance: advance,
    onRetryConfirmation: doRetryConfirmation,
    onResendReady: doResendReady,
    onCancel: doCancel,
    onForceStatus: forceStatus,
  };

  return (
    <div className="relative z-10 min-h-[100dvh]">
      <BrandWatermark />
      <StaffNav />

      <div className="mx-auto max-w-6xl px-3 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-extrabold text-espresso">Orders board</h1>
          <ConnectionStatus connection={connection} lastUpdated={lastUpdated} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BOARD_COLUMNS.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              {...cardHandlers}
            />
          ))}
        </div>

        <AdminRecovery
          now={now}
          busyIds={busyIds}
          onAdvance={advance}
          onRetryConfirmation={doRetryConfirmation}
          onResendReady={doResendReady}
          onCancel={doCancel}
          onForceStatus={forceStatus}
        />
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-fit max-w-[90%] rounded-2xl bg-bean px-4 py-3 text-center text-sm font-semibold text-cream shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}

interface AdminRecoveryProps {
  now: number;
  busyIds: Set<string>;
  onAdvance: (order: OrderPublic, next: OrderStatus) => void;
  onRetryConfirmation: (order: OrderPublic) => void;
  onResendReady: (order: OrderPublic) => void;
  onCancel: (order: OrderPublic) => void;
  onForceStatus: (order: OrderPublic, status: OrderStatus) => void;
}

function AdminRecovery({
  now,
  busyIds,
  onAdvance,
  onRetryConfirmation,
  onResendReady,
  onCancel,
  onForceStatus,
}: AdminRecoveryProps) {
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [mobileLast4, setMobileLast4] = useState('');
  const [results, setResults] = useState<OrderPublic[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const params: { order_number?: string; mobile_last4?: string } = {};
    if (orderNumber.trim()) params.order_number = orderNumber.trim();
    if (mobileLast4.trim()) params.mobile_last4 = mobileLast4.trim();
    if (!params.order_number && !params.mobile_last4) {
      setMessage('Enter an order number or last 4 digits of the mobile.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await searchOrders(params);
      setResults(res.orders);
      if (res.orders.length === 0) setMessage('No matching orders.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDelivered = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getDeliveredOrders(20);
      setResults(res.orders);
      if (res.orders.length === 0) setMessage('No delivered orders yet.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not load delivered orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary w-full py-3"
      >
        {open ? 'Hide admin & recovery tools' : 'Admin & recovery tools'}
      </button>

      {open && (
        <div className="mt-3 card p-4">
          <form onSubmit={runSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="search-order" className="label">
                Order number
              </label>
              <input
                id="search-order"
                className="field"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. BT0007"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="search-mobile" className="label">
                Mobile last 4
              </label>
              <input
                id="search-mobile"
                className="field"
                value={mobileLast4}
                onChange={(e) => setMobileLast4(e.target.value)}
                placeholder="e.g. 3210"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3">
                {loading ? 'Searching…' : 'Search'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={loadDelivered}
                className="btn btn-ghost flex-1 py-3"
              >
                Recent delivered
              </button>
            </div>
          </form>

          {message && <p className="mt-3 text-sm font-semibold text-mocha">{message}</p>}

          {results && results.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  now={now}
                  busy={busyIds.has(order.order_id)}
                  defaultExpanded
                  hideAdvance={
                    order.status === 'DELIVERED' || order.status === 'CANCELLED'
                  }
                  onAdvance={onAdvance}
                  onRetryConfirmation={onRetryConfirmation}
                  onResendReady={onResendReady}
                  onCancel={onCancel}
                  onForceStatus={onForceStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Orders;
