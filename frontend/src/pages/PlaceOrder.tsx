import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, createOrder } from '../services/api';
import type {
  CreateOrderResponse,
  OrderItem,
  PaymentMethod,
} from '../types/order';
import { LS_COUNTER_KEY } from '../config/constants';
import { ProductSelector, type ProductQuantities } from '../components/ProductSelector';
import { PaymentSelector } from '../components/PaymentSelector';
import { OrderSuccess } from '../components/OrderSuccess';
import { StaffNav } from '../components/StaffNav';

function readCounter(): string {
  try {
    return localStorage.getItem(LS_COUNTER_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeCounter(value: string) {
  try {
    localStorage.setItem(LS_COUNTER_KEY, value);
  } catch {
    /* ignore storage failures */
  }
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PlaceOrder() {
  const [quantities, setQuantities] = useState<ProductQuantities>({});
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('UPI');
  const [counter, setCounter] = useState<string>(() => readCounter());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);

  // Same idempotency key is reused across retries of one attempt; cleared on success.
  const idempotencyKeyRef = useRef<string | null>(null);

  const items: OrderItem[] = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([product, quantity]) => ({ product, quantity })),
    [quantities],
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const canSubmit =
    !submitting && items.length > 0 && customerName.trim().length > 0 && mobile.trim().length > 0;

  useEffect(() => {
    writeCounter(counter);
  }, [counter]);

  const resetForm = () => {
    setQuantities({});
    setCustomerName('');
    setMobile('');
    setNotes('');
    setAmount('');
    setPayment('UPI');
    setError(null);
    setResult(null);
    idempotencyKeyRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = newIdempotencyKey();
    }

    const parsedAmount = amount.trim() === '' ? null : Number(amount);
    if (parsedAmount != null && Number.isNaN(parsedAmount)) {
      setError('Amount must be a number, or left blank.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createOrder({
        customer_name: customerName.trim(),
        mobile: mobile.trim(),
        items,
        notes: notes.trim(),
        amount: parsedAmount,
        payment_method: payment,
        created_by: counter.trim(),
        idempotency_key: idempotencyKeyRef.current,
      });

      if (res.success && res.order_created) {
        idempotencyKeyRef.current = null; // Success: next order gets a fresh key.
        setResult(res);
      } else {
        // Not created: keep the key so a retry is idempotent.
        setError('Order was not created. Please try again.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.detail) {
          setError(err.detail); // Invalid mobile message from backend.
        } else if (err.status === 0) {
          setError('Cannot reach the server. Check your connection and retry.');
        } else {
          setError(err.detail ?? 'Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
      // Keep idempotency key for the retry.
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-[100dvh] bg-cream">
        <StaffNav />
        <div className="px-4 py-8">
          <OrderSuccess result={result} onNext={resetForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-cream">
      <StaffNav />
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-4 py-5 pb-32">
        <h1 className="mb-4 font-display text-2xl font-extrabold text-espresso">New order</h1>

        <section className="mb-5">
          <p className="label">Menu</p>
          <ProductSelector quantities={quantities} onChange={setQuantities} />
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3">
          <div>
            <label htmlFor="name" className="label">
              Customer name
            </label>
            <input
              id="name"
              className="field"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="mobile" className="label">
              Mobile number
            </label>
            <input
              id="mobile"
              className="field"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile"
              inputMode="tel"
              autoComplete="off"
            />
          </div>
        </section>

        <section className="mb-4">
          <p className="label">Payment</p>
          <PaymentSelector value={payment} onChange={setPayment} />
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="amount" className="label">
              Amount (optional)
            </label>
            <input
              id="amount"
              className="field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹"
              inputMode="decimal"
            />
          </div>
          <div>
            <label htmlFor="counter" className="label">
              Counter / staff
            </label>
            <input
              id="counter"
              className="field"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              placeholder="e.g. Counter 1"
              autoComplete="off"
            />
          </div>
        </section>

        <section className="mb-4">
          <label htmlFor="notes" className="label">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            className="field min-h-[64px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Less sugar, extra hot, etc."
          />
        </section>

        {error && (
          <p className="mb-3 rounded-xl bg-cancelled/10 px-3 py-2 text-sm font-semibold text-cancelled">
            {error}
          </p>
        )}

        {/* Sticky submit bar for fast one-thumb operation */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="text-sm font-semibold text-espresso">
              {totalItems > 0 ? (
                <>
                  {totalItems} item{totalItems === 1 ? '' : 's'}
                </>
              ) : (
                'No items yet'
              )}
            </div>
            <button type="submit" disabled={!canSubmit} className="btn btn-primary btn-lg flex-1">
              {submitting ? 'Placing…' : 'Place order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default PlaceOrder;
