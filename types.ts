export interface ProductVariant {
  weight: string;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  expirationDate?: string;
  usageLimit?: number | null; // null = unlimited
  usageCount: number;
  isActive: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  intensity: number; // 1-5
  roast: 'Light' | 'Medium' | 'Dark';
  category: 'Beans' | 'Filter Powder' | 'Instant';
  tastingNotes: string;
  bestFor: string;
  variants: ProductVariant[];
}

export interface CartItem extends Product {
  selectedVariant: ProductVariant;
  quantity: number;
  selectedIntensity?: 'Light' | 'Medium' | 'Strong';
}

export interface UserDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  email: string;
}

export interface User extends UserDetails {
  id: string; // mapped from _id
  _id?: string;
  password?: string;
  token?: string;
  isAdmin?: boolean;
  joinedDate?: string;
}

export interface Order {
  id: string;
  date: string;
  customer: UserDetails;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  userEmail?: string; // Link to user
}

export enum AppView {
  HOME = 'HOME',
  SHOP = 'SHOP',
  CHECKOUT = 'CHECKOUT',
  SUCCESS = 'SUCCESS',
  ABOUT = 'ABOUT',
  AUTH = 'AUTH',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
}
