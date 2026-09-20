import type { OrderPublic, OrderStatus } from '../types/order';
import { OrderCard } from './OrderCard';
import { STATUS_DOT, STATUS_LABEL } from '../utils/format';

interface StatusColumnProps {
  status: OrderStatus;
  orders: OrderPublic[];
  now: number;
  busyIds: Set<string>;
  onAdvance: (order: OrderPublic, next: OrderStatus) => void;
  onRetryConfirmation: (order: OrderPublic) => void;
  onResendReady: (order: OrderPublic) => void;
  onCancel: (order: OrderPublic) => void;
  onForceStatus: (order: OrderPublic, status: OrderStatus) => void;
}

/** One board column (RECEIVED / PREPARING / READY) with its order cards. */
export function StatusColumn({
  status,
  orders,
  now,
  busyIds,
  onAdvance,
  onRetryConfirmation,
  onResendReady,
  onCancel,
  onForceStatus,
}: StatusColumnProps) {
  return (
    <section className="flex min-w-0 flex-col">
      <header className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-2xl bg-espresso px-4 py-3 text-cream shadow-card">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${STATUS_DOT[status]}`} />
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            {STATUS_LABEL[status]}
          </h2>
        </div>
        <span className="rounded-full bg-cream/20 px-2.5 py-0.5 text-sm font-bold tabular-nums">
          {orders.length}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand px-4 py-8 text-center text-sm text-mocha">
            No orders
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              now={now}
              busy={busyIds.has(order.order_id)}
              onAdvance={onAdvance}
              onRetryConfirmation={onRetryConfirmation}
              onResendReady={onResendReady}
              onCancel={onCancel}
              onForceStatus={onForceStatus}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default StatusColumn;
