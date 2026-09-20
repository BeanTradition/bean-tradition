interface QuantityControlProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

/** Large [-] n [+] stepper with big touch targets for fast staff use. */
export function QuantityControl({
  value,
  onChange,
  min = 0,
  max = 99,
  ariaLabel = 'Quantity',
}: QuantityControlProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center overflow-hidden rounded-2xl border border-sand bg-white">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="flex h-12 w-12 items-center justify-center text-2xl font-bold text-espresso
          active:bg-latte disabled:opacity-30"
      >
        &minus;
      </button>
      <span
        aria-live="polite"
        className="min-w-[2.5rem] text-center text-xl font-bold tabular-nums text-bean"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label={`Increase ${ariaLabel}`}
        className="flex h-12 w-12 items-center justify-center text-2xl font-bold text-espresso
          active:bg-latte disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export default QuantityControl;
