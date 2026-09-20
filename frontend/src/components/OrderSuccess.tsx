import { useEffect, useState } from 'react';
import type { CreateOrderResponse } from '../types/order';

interface OrderSuccessProps {
  result: CreateOrderResponse;
  onNext: () => void;
}

/**
 * Shown after a confirmed order. Displays the order number, tracking URL and a
 * clear warning if the WhatsApp confirmation was NOT sent.
 */
export function OrderSuccess({ result, onNext }: OrderSuccessProps) {
  const { order, whatsapp } = result;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.tracking_url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ready/15 text-4xl">
        ✓
      </div>
      <h2 className="mt-4 font-display text-2xl font-extrabold text-espresso">Order confirmed</h2>

      <div className="mt-5 w-full card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-mocha">Order number</p>
        <p className="mt-1 font-display text-4xl font-extrabold tracking-wide text-bean">
          {order.order_number}
        </p>

        <div className="mt-5 text-left">
          <p className="label">Tracking link</p>
          <div className="flex items-stretch gap-2">
            <input readOnly value={order.tracking_url} className="field flex-1 text-sm" />
            <button type="button" onClick={copy} className="btn btn-secondary px-4">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-caramel underline"
          >
            Open tracking page
          </a>
        </div>

        <div className="mt-5">
          {whatsapp.confirmation_sent ? (
            <div className="rounded-2xl bg-ready/12 px-4 py-3 text-left text-sm font-semibold text-ready">
              WhatsApp confirmation sent to the customer.
            </div>
          ) : (
            <div className="rounded-2xl border border-cancelled/40 bg-cancelled/10 px-4 py-3 text-left text-sm text-cancelled">
              <p className="font-bold">WhatsApp confirmation was NOT sent.</p>
              <p className="mt-1 font-medium">
                Tell the customer their order number verbally and share the tracking link.
                {whatsapp.error ? ` Reason: ${whatsapp.error}` : ''}
              </p>
              <p className="mt-1 font-medium">
                You can retry the confirmation from the Orders board.
              </p>
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={onNext} className="btn btn-primary btn-lg mt-6 w-full">
        New order
      </button>
    </div>
  );
}

export default OrderSuccess;
