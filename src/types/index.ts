export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  size: string;
  condition: string;
  image_url: string;
  seller_id: string;
  created_at: string;
  average_rating?: number;
  media?: ProductMedia[];
  stock: number;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'cliente' | 'vendedor';
  whatsapp?: string;
  identity_number?: string;
  linkedin_url?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

export interface CheckoutSession {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
}

export interface ProductRating {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}