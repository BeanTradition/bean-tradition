import { PAYMENT_METHODS } from '../config/products';
import type { PaymentMethod } from '../types/order';

interface PaymentSelectorProps {
  value: PaymentMethod;
  onChange: (next: PaymentMethod) => void;
}

/** Segmented UPI / Cash selector with large touch targets. */
export function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map((method) => {
        const active = value === method;
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(method)}
            className={`min-h-[56px] rounded-2xl border text-lg font-bold transition ${
              active
                ? 'border-espresso bg-espresso text-cream shadow-card'
                : 'border-sand bg-white text-espresso'
            }`}
          >
            {method}
          </button>
        );
      })}
    </div>
  );
}

export default PaymentSelector;
