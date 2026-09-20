import type { PaymentMethod } from '../types/order';

export interface ProductOption {
  id: string;
  name: string;
  /** Short label used on compact UI. */
  short: string;
  /** Unit price in rupees (finalized event menu). */
  price: number;
}

// Finalized event menu with confirmed prices (in rupees).
export const PRODUCTS: ProductOption[] = [
  { id: 'cappuccino', name: 'Cappuccino', short: 'Capp', price: 150 },
  { id: 'americano-hot', name: 'Americano (Hot)', short: 'Hot Amer', price: 150 },
  { id: 'iced-americano', name: 'Iced Americano', short: 'Iced Amer', price: 180 },
  { id: 'cold-coffee', name: 'Cold Coffee', short: 'Cold', price: 180 },
];

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash'];
