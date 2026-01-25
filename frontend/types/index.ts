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
  imageUrl?: string;
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
  userId: string;
  orderNumber: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: CartItem[];
  total: number;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
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
