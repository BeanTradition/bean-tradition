import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTracking } from '../hooks/useTracking';
import type { OrderStatus } from '../types/order';
import { TrackingHeader } from '../components/TrackingHeader';
import { TrackingQueue } from '../components/TrackingQueue';
import { ReadyAlert } from '../components/ReadyAlert';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { BrandWatermark } from '../components/BrandWatermark';

const BASE_TITLE = 'Bean Tradition';

/** Short WebAudio beep. Fully feature-detected and best-effort. */
function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* ignore audio failures */
  }
}

function fireReadyAlert(orderNumber: string) {
  // Tab title.
  document.title = `☕ ${orderNumber} READY!`;

  // Vibrate (feature-detected).
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([300, 150, 300]);
    } catch {
      /* ignore */
    }
  }

  // Beep.
  playBeep();

  // Browser notification only if permission already granted.
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Your order is ready!', {
        body: `${orderNumber} is ready. Please collect it from the Bean Tradition counter.`,
      });
    }
  } catch {
    /* ignore notification failures */
  }
}

export function TrackOrder() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, connection, lastUpdated, invalid } = useTracking(token);

  const prevStatus = useRef<OrderStatus | null>(null);
  const myOrder = data?.my_order;
  const isReady = myOrder?.status === 'READY';

  // Detect PREPARING -> READY transition client-side and fire alerts.
  useEffect(() => {
    const status = myOrder?.status;
    if (!status || !myOrder) {
      return;
    }
    const prev = prevStatus.current;
    if (prev && prev !== 'READY' && status === 'READY') {
      fireReadyAlert(myOrder.order_number);
    }
    if (status !== 'READY') {
      document.title = BASE_TITLE;
    }
    prevStatus.current = status;
  }, [myOrder]);

  // Restore the tab title on unmount.
  useEffect(() => {
    return () => {
      document.title = BASE_TITLE;
    };
  }, []);

  if (invalid) {
    return (
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-4 text-center">
        <BrandWatermark />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cancelled/15 text-3xl">
          ✕
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-espresso">
          Invalid tracking link.
        </h1>
        <p className="mt-2 text-mocha">
          Please check the link from your WhatsApp confirmation message.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto min-h-[100dvh] max-w-md px-4 pb-10">
      <BrandWatermark />
      <TrackingHeader />

      {!myOrder ? (
        <div className="mt-10 flex flex-col items-center text-center text-mocha">
          <span className="h-3 w-3 animate-pulse rounded-full bg-caramel" />
          <p className="mt-3">Loading your order…</p>
        </div>
      ) : (
        <>
          <section className="mt-6 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-mocha">Your order</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-wide text-espresso">
              {myOrder.order_number}
            </p>
            {myOrder.items_display && (
              <p className="mt-1 text-sm font-medium text-mocha">{myOrder.items_display}</p>
            )}
          </section>

          <section className="mt-6">
            {isReady ? (
              <div className="animate-ready-glow rounded-xl2 bg-ready px-5 py-8 text-center text-white shadow-pop">
                <p className="font-display text-3xl font-extrabold uppercase tracking-wide">
                  Your order is ready!
                </p>
                <p className="mt-2 text-lg font-semibold">
                  Please collect it from the Bean Tradition counter.
                </p>
              </div>
            ) : myOrder.status === 'DELIVERED' ? (
              <div className="rounded-xl2 bg-delivered px-5 py-8 text-center text-white shadow-card">
                <p className="font-display text-2xl font-extrabold uppercase tracking-wide">
                  Order delivered
                </p>
                <p className="mt-2 font-semibold">Enjoy your coffee. Thank you!</p>
              </div>
            ) : myOrder.status === 'CANCELLED' ? (
              <div className="rounded-xl2 bg-cancelled px-5 py-8 text-center text-white shadow-card">
                <p className="font-display text-2xl font-extrabold uppercase tracking-wide">
                  Order cancelled
                </p>
                <p className="mt-2 font-semibold">Please check with the counter.</p>
              </div>
            ) : (
              <div className="rounded-xl2 bg-preparing px-5 py-8 text-center text-white shadow-card">
                <p className="font-display text-3xl font-extrabold uppercase tracking-wide">
                  Preparing
                </p>
                <p className="mt-2 text-lg font-semibold">
                  We are getting your order ready. Please wait.
                </p>
              </div>
            )}
          </section>

          {!isReady && myOrder.status !== 'DELIVERED' && myOrder.status !== 'CANCELLED' && (
            <div className="mt-4">
              <ReadyAlert isReady={isReady} orderNumber={myOrder.order_number} />
            </div>
          )}

          <div className="mt-6 space-y-4">
            <TrackingQueue
              title="Ready for pickup"
              orders={data?.ready_orders ?? []}
              highlight={myOrder.order_number}
              tone="ready"
              emptyText="No orders ready right now."
            />
            <TrackingQueue
              title="Preparing"
              orders={data?.preparing_orders ?? []}
              highlight={myOrder.order_number}
              tone="preparing"
              emptyText="No orders being prepared right now."
            />
          </div>
        </>
      )}

      <div className="mt-8 flex justify-center">
        <ConnectionStatus connection={connection} lastUpdated={lastUpdated} />
      </div>

      <p className="mt-4 text-center text-xs text-mocha">
        This page updates automatically. No need to refresh.
      </p>
    </div>
  );
}

export default TrackOrder;
