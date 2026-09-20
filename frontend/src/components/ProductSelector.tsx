import { PRODUCTS } from '../config/products';
import { QuantityControl } from './QuantityControl';

export type ProductQuantities = Record<string, number>;

interface ProductSelectorProps {
  quantities: ProductQuantities;
  onChange: (next: ProductQuantities) => void;
}

/**
 * Large tap-to-add product buttons. Tapping a product adds one; a per-product
 * QuantityControl appears once it has a quantity.
 */
export function ProductSelector({ quantities, onChange }: ProductSelectorProps) {
  const setQty = (name: string, qty: number) => {
    const next = { ...quantities };
    if (qty <= 0) {
      delete next[name];
    } else {
      next[name] = qty;
    }
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {PRODUCTS.map((p) => {
        const qty = quantities[p.name] ?? 0;
        const active = qty > 0;
        return (
          <div
            key={p.id}
            className={`flex flex-col justify-between rounded-2xl border p-3 transition ${
              active
                ? 'border-caramel bg-latte shadow-card'
                : 'border-sand bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setQty(p.name, qty + 1)}
              className="flex min-h-[64px] flex-1 flex-col items-start justify-center text-left"
              aria-label={`Add ${p.name}`}
            >
              <span className="text-lg font-bold leading-tight text-bean">{p.name}</span>
              <span className="mt-0.5 text-sm text-mocha">
                {active ? `${qty} in order` : 'Tap to add'}
              </span>
            </button>

            {active && (
              <div className="mt-2 flex justify-center">
                <QuantityControl
                  value={qty}
                  min={0}
                  onChange={(n) => setQty(p.name, n)}
                  ariaLabel={`${p.name} quantity`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProductSelector;
