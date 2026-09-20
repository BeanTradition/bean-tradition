interface TrackingQueueProps {
  title: string;
  orders: string[];
  highlight: string;
  tone: 'ready' | 'preparing';
  emptyText: string;
}

/**
 * Renders a list of order numbers (READY FOR PICKUP or PREPARING). The
 * customer's own number is auto-highlighted.
 */
export function TrackingQueue({ title, orders, highlight, tone, emptyText }: TrackingQueueProps) {
  const toneHeader = tone === 'ready' ? 'text-ready' : 'text-preparing';

  return (
    <section className="card p-4">
      <h3 className={`mb-3 font-display text-sm font-extrabold uppercase tracking-widest ${toneHeader}`}>
        {title}
        <span className="ml-2 text-mocha">({orders.length})</span>
      </h3>

      {orders.length === 0 ? (
        <p className="text-sm text-mocha">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {orders.map((num) => {
            const mine = num === highlight;
            const base =
              tone === 'ready'
                ? 'bg-ready/12 text-ready'
                : 'bg-preparing/15 text-preparing';
            return (
              <li
                key={num}
                className={`rounded-xl px-3 py-2 text-lg font-bold tabular-nums ${
                  mine ? 'bg-espresso text-cream ring-2 ring-caramel' : base
                }`}
              >
                {num}
                {mine && <span className="ml-1 text-xs font-semibold uppercase">you</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TrackingQueue;
