export interface Product {
  id: number | string;
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
}

export const categories = [
  { id: 1, name: 'Windows', icon: '🪟', count: 8, color: 'from-blue-500 to-blue-700' },
  { id: 2, name: 'Office', icon: '📊', count: 12, color: 'from-orange-500 to-red-600' },
  { id: 3, name: 'Software', icon: '💻', count: 15, color: 'from-cyan-500 to-blue-600' },
  { id: 4, name: 'Subscription', icon: '🔄', count: 20, color: 'from-purple-500 to-pink-600' },
  { id: 5, name: 'Adobe', icon: '🎨', count: 6, color: 'from-red-500 to-red-700' },
  { id: 6, name: 'Antivirus', icon: '🛡️', count: 5, color: 'from-green-500 to-emerald-600' },
];

export const topProducts: Product[] = [
  {
    id: 1,
    name: 'Windows 11 Pro Licence Key',
    category: 'Windows',
    price: 599,
    originalPrice: 9999,
    discount: 94,
    rating: 5.0,
    reviews: 248,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png',
    isBestseller: true,
  },
  {
    id: 2,
    name: 'Adobe Creative Cloud',
    category: 'Adobe',
    price: 599,
    originalPrice: 1999,
    discount: 70,
    rating: 4.8,
    reviews: 185,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg',
  },
  {
    id: 3,
    name: 'Microsoft Office 365 Personal',
    category: 'Office',
    price: 1999,
    originalPrice: 16999,
    discount: 88,
    rating: 4.9,
    reviews: 320,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp',
    isBestseller: true,
  },
  {
    id: 4,
    name: 'Netflix Subscription Bangladesh',
    category: 'Subscription',
    price: 499,
    originalPrice: 2599,
    discount: 81,
    rating: 4.7,
    reviews: 412,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp',
  },
  {
    id: 5,
    name: 'Microsoft Office 2021 Pro Plus',
    category: 'Office',
    price: 499,
    originalPrice: 999,
    discount: 50,
    rating: 4.8,
    reviews: 267,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_948f3768-debc-48ca-beaa-32c23af5cd3d-copy-800x800.png',
    isNew: true,
  },
  {
    id: 6,
    name: 'Internet Download Manager Lifetime',
    category: 'Software',
    price: 2625,
    originalPrice: 3300,
    discount: 20,
    rating: 4.6,
    reviews: 189,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_3ac6ceea-b405-4a5b-99b7-170759d3cfc6-2-800x800.png',
  },
  {
    id: 7,
    name: 'Windows 11 Home License Key',
    category: 'Windows',
    price: 549,
    originalPrice: 7999,
    discount: 93,
    rating: 4.9,
    reviews: 301,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_f8647d13-0805-4b20-bdec-c1cc79a6bce4-800x800.png',
  },
  {
    id: 8,
    name: 'ElevenLabs AI Subscription',
    category: 'Subscription',
    price: 4449,
    originalPrice: 11999,
    discount: 63,
    rating: 4.7,
    reviews: 98,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2025/12/generated_image_4a22a954-e1ac-496e-9cef-cf2a54d30597-1-800x800.png',
    isNew: true,
  },
];

export const flashSaleProducts: Product[] = [
  {
    id: 9,
    name: 'Spotify Premium 1 Year',
    category: 'Subscription',
    price: 899,
    originalPrice: 5999,
    discount: 85,
    rating: 4.9,
    reviews: 543,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/1024px-Spotify_logo_with_text.svg.png',
  },
  {
    id: 10,
    name: 'Windows 11 Enterprise License',
    category: 'Windows',
    price: 4999,
    originalPrice: 18499,
    discount: 73,
    rating: 4.8,
    reviews: 134,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png',
  },
  {
    id: 11,
    name: 'Microsoft Office 365 Family',
    category: 'Office',
    price: 8499,
    originalPrice: 14999,
    discount: 43,
    rating: 4.9,
    reviews: 221,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp',
  },
  {
    id: 12,
    name: 'Office 2019 Pro Plus License',
    category: 'Office',
    price: 499,
    originalPrice: 999,
    discount: 50,
    rating: 4.7,
    reviews: 178,
    image: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_948f3768-debc-48ca-beaa-32c23af5cd3d-copy-800x800.png',
  },
];
