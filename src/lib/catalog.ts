/**
 * Shop catalogue entry point.
 *
 * The product model and its sample data live in `./products` — that is the file
 * to swap for a database query later. This module keeps the editorial
 * collections and re-exports the product surface so existing pages and
 * components can keep importing from `@/lib/catalog`.
 */
export type { Product, ProductImage, ProductColor, ProductDetail } from './products';
export {
  products,
  categories,
  getProductBySlug,
  getProductById,
  getNewArrivals,
  getFeaturedProducts,
  getRelatedProducts,
  getStockStatus,
  isInStock,
  hasSizeChoice,
  hasColorChoice,
  productHref,
} from './products';

export type Collection = {
  label: string;
  name: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

export const collections: Collection[] = [
  {
    label: '01',
    name: 'Heritage',
    description:
      'Rich textures, traditional craftsmanship and timeless Indian details reinterpreted for today.',
    image:
      'https://images.pexels.com/photos/37975932/pexels-photo-37975932.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up of intricately embroidered Indian textile in deep red thread',
    href: '/collections#heritage',
  },
  {
    label: '02',
    name: 'Modern Heirlooms',
    description: 'Contemporary silhouettes inspired by the elegance of Indian ceremonial dressing.',
    image:
      'https://images.pexels.com/photos/36880919/pexels-photo-36880919.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Woman wearing a red saree with traditional jewellery, photographed in low warm light',
    href: '/collections#modern-heirlooms',
  },
  {
    label: '03',
    name: 'The Everyday Edit',
    description: 'Effortless Indian-fusion pieces designed for modern everyday living.',
    image:
      'https://images.pexels.com/photos/35212993/pexels-photo-35212993.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Woman in a green saree photographed in a clean studio setting',
    href: '/collections#the-everyday-edit',
  },
];

export function isNewArrival(product: { isNew: boolean }): boolean {
  return product.isNew;
}
