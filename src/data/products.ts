export interface Product {
  id: number | string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  customFields?: any[];
  stockQuantity?: number | null;
  status?: string;
}

// Central helper — a product is out of stock if admin set status='out_of_stock'
// OR if stock_quantity is explicitly 0 (null = untracked stock, treated as available).
export const isProductOutOfStock = (p: {
  status?: string | null;
  stockQuantity?: number | null;
}): boolean => {
  if (p.status === 'out_of_stock') return true;
  if (typeof p.stockQuantity === 'number' && p.stockQuantity <= 0) return true;
  return false;
};
