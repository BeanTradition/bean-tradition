import type { PaymentMethod } from '../types/order';

export interface ProductOption {
  id: string;
  name: string;
  /** Short label used on compact UI. */
  short: string;
}

// Seed products for the event menu. Kept intentionally small and fast to tap.
export const PRODUCTS: ProductOption[] = [
  { id: 'cappuccino', name: 'Cappuccino', short: 'Capp' },
  { id: 'cold-coffee', name: 'Cold Coffee', short: 'Cold' },
  { id: 'americano', name: 'Americano', short: 'Amer' },
  { id: 'filter-coffee', name: 'Filter Coffee', short: 'Filter' },
  { id: 'espresso', name: 'Espresso', short: 'Esp' },
];

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash'];
