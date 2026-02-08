export interface User {
  id: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string | Array<string | { id?: number; name: string }>;
  categories?: Array<{ id?: number; name: string; code?: string }>;
  imageUrl?: string;
  aisle?: string;
  section?: string;
  shelfLocation?: string;
  currency?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userRef?: string;  // Backend uses userRef, not userId
  userId?: string;   // Keep for backwards compatibility
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  total: number;     // Backend returns totalCents and calculates getTotal()
  totalPrice: number; // Alias for total
  totalCents?: number;
  currency?: string;
  placedAt?: string;
  shippingRecipient?: string;
  shippingStreet1?: string;
  shippingStreet2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  paymentMethodType?: string;
  paymentLast4?: string;
  paymentBrand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  recipient: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';
  last4?: string;
  brand?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}
