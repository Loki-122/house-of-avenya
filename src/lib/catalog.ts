/**
 * Shop catalogue entry point — Supabase-backed with static fallback.
 *
 * This module provides async functions that query Supabase when available,
 * falling back to the static catalogue in ./products. Existing pages and
 * components can keep importing from `@/lib/catalog` — only the data source
 * changes.
 */
export type { Product, ProductImage, ProductColor, ProductDetail, Collection } from './products';
export {
  products as staticProducts,
  categories as staticCategories,
  getProductBySlug as getStaticProductBySlug,
  getProductById as getStaticProductById,
  getNewArrivals as getStaticNewArrivals,
  getFeaturedProducts as getStaticFeaturedProducts,
  getRelatedProducts,
  getStockStatus,
  isInStock,
  hasSizeChoice,
  hasColorChoice,
  productHref,
  collections,
  isNewArrival,
} from './products';

import { getAllProducts, getProductBySlug, getProductById, getNewArrivals, getFeaturedProducts, getCategories } from './supabase-products';
import { products as staticProducts, categories as staticCategories, getRelatedProducts, getStockStatus, isInStock, hasSizeChoice, hasColorChoice, productHref, collections, isNewArrival, type Product, type Collection } from './products';

let productsCache: Product[] | null = null;
let categoriesCache: string[] | null = null;

async function getProductsSource(): Promise<Product[]> {
  if (productsCache) return productsCache;

  try {
    const dbProducts = await getAllProducts();
    if (dbProducts.length > 0) {
      productsCache = dbProducts;
      return dbProducts;
    }
  } catch (e) {
    console.warn('Supabase unavailable, falling back to static products:', e);
  }

  productsCache = staticProducts;
  return staticProducts;
}

async function getCategoriesSource(): Promise<string[]> {
  if (categoriesCache) return categoriesCache;

  try {
    const dbCategories = await getCategories();
    if (dbCategories.length > 0) {
      categoriesCache = dbCategories;
      return dbCategories;
    }
  } catch (e) {
    console.warn('Supabase unavailable, falling back to static categories:', e);
  }

  categoriesCache = staticCategories;
  return staticCategories;
}

export async function getProducts(): Promise<Product[]> {
  return getProductsSource();
}

export async function getCategoriesList(): Promise<string[]> {
  return getCategoriesSource();
}

export async function getProductBySlugAsync(slug: string): Promise<Product | undefined> {
  try {
    const product = await getProductBySlug(slug);
    if (product) return product;
  } catch (e) {
    console.warn('Supabase query failed, using static data:', e);
  }
  const { getProductBySlug: staticGetBySlug } = await import('./products');
  return staticGetBySlug(slug);
}

export async function getProductByIdAsync(id: string): Promise<Product | undefined> {
  try {
    const product = await getProductById(id);
    if (product) return product;
  } catch (e) {
    console.warn('Supabase query failed, using static data:', e);
  }
  const { getProductById: staticGetById } = await import('./products');
  return staticGetById(id);
}

export async function getNewArrivalsAsync(): Promise<Product[]> {
  try {
    const products = await getNewArrivals();
    if (products.length > 0) return products;
  } catch (e) {
    console.warn('Supabase query failed, using static data:', e);
  }
  const { getNewArrivals: staticGetNew } = await import('./products');
  return staticGetNew();
}

export async function getFeaturedProductsAsync(): Promise<Product[]> {
  try {
    const products = await getFeaturedProducts();
    if (products.length > 0) return products;
  } catch (e) {
    console.warn('Supabase query failed, using static data:', e);
  }
  const { getFeaturedProducts: staticGetFeatured } = await import('./products');
  return staticGetFeatured();
}

export async function getRelatedProductsAsync(product: Product, limit = 4): Promise<Product[]> {
  const allProducts = await getProductsSource();
  const others = allProducts.filter(candidate => candidate.id !== product.id);
  const sameCategory = others.filter(candidate => candidate.category === product.category);
  const rest = others.filter(candidate => candidate.category !== product.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

// Re-export synchronous utilities and constants for backward compatibility
export { staticProducts as products };