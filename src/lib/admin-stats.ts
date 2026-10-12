/**
 * Dashboard statistics for the admin panel.
 *
 * Reads only the public catalogue tables (products, categories,
 * product_variants) that the storefront already exposes to the
 * anon role, aggregated server-side. The admin layout has already
 * verified the visitor is an admin before this runs.
 */
import { createSupabaseServerClient } from './supabase-server';

export type AdminDashboardStats = {
  totalProducts: number;
  /** Products with at least one unit in stock. */
  activeProducts: number;
  /** In stock, but at or below the low-stock threshold. */
  lowStockProducts: number;
  /** No units in any variant. */
  outOfStockProducts: number;
  totalCategories: number;
  totalVariants: number;
  /** Sum of price x stock across every product, in rupees. */
  inventoryValue: number;
  recentProducts: AdminRecentProduct[];
};

export type AdminRecentProduct = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  image: string | null;
  createdAt: string;
};

/** Matches the storefront's low-stock rendering (getStockStatus). */
export const LOW_STOCK_THRESHOLD = 5;

type DbVariant = { stock: number };

type DbProductStock = {
  id: string;
  price: number;
  is_active?: boolean;
  product_variants: DbVariant[] | null;
};

type DbRecentImage = { src: string; display_order: number };

type DbRecentProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  created_at: string;
  category: { name: string } | null;
  product_images: DbRecentImage[] | null;
  product_variants: DbVariant[] | null;
};

function totalStock(variants: DbVariant[] | null): number {
  return (variants ?? []).reduce((sum, variant) => sum + variant.stock, 0);
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createSupabaseServerClient();

  const [stockResult, categoriesResult, variantsResult, recentResult] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, price, product_variants(stock)'),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase
        .from('product_variants')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select(
          `
          id,
          slug,
          name,
          price,
          created_at,
          category:categories(name),
          product_images(src, display_order),
          product_variants(stock)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const products = stockResult?.data ?? [];
  const perProduct = products.map((product: DbProductStock) => ({
    price: product.price,
    stock: totalStock(product.product_variants),
    is_active: product.is_active ?? true,
  }));

  const activeProducts = perProduct.filter((p) => p.is_active && p.stock > 0).length;
  const lowStockProducts = perProduct.filter(
    (p) => p.is_active && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStockProducts = perProduct.filter(
    (p) => p.is_active && p.stock <= 0,
  ).length;

  const recentProducts = (recentResult?.data ??
    []) as unknown as DbRecentProduct[];

  const recent: AdminRecentProduct[] = recentProducts.map(
    (product: DbRecentProduct) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category?.name ?? null,
      price: product.price,
      stock: totalStock(product.product_variants),
      image:
        (product.product_images ?? [])
          .sort((a, b) => a.display_order - b.display_order)[0]
          ?.src ?? null,
      createdAt: product.created_at,
    }),
  );

  return {
    totalProducts: perProduct.length,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCategories: categoriesResult?.count ?? 0,
    totalVariants: variantsResult?.count ?? 0,
    inventoryValue: perProduct.reduce((sum, p) => sum + p.price * p.stock, 0),
    recentProducts: recent,
  };
}
