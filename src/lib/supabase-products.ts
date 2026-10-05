import { createSupabaseServerClient } from './supabase-server';
import type { Product, ProductImage, ProductColor, ProductDetail } from './products';

export type DbProduct = {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  description: string;
  price: number;
  compare_at_price: number | null;
  material: string | null;
  is_featured: boolean;
  is_new: boolean;
  category: {
    name: string;
    slug: string;
  } | null;
  images: DbProductImage[];
  colors: DbProductColor[];
  sizes: DbProductSize[];
  variants: DbProductVariant[];
  details: DbProductDetail[];
  care: DbProductCare[];
};

export type DbProductImage = {
  id: string;
  src: string;
  alt: string;
  display_order: number;
};

export type DbProductColor = {
  id: string;
  name: string;
  hex: string;
  display_order: number;
};

export type DbProductSize = {
  id: string;
  name: string;
  display_order: number;
};

export type DbProductVariant = {
  id: string;
  size_id: string | null;
  color_id: string | null;
  stock: number;
  sku: string | null;
};

export type DbProductDetail = {
  id: string;
  label: string;
  value: string;
  display_order: number;
};

export type DbProductCare = {
  id: string;
  instruction: string;
  display_order: number;
};

function mapDbProductToProduct(db: DbProduct): Product {
  const colorMap = new Map(db.colors.map(c => [c.id, { name: c.name, hex: c.hex }]));
  const sizeMap = new Map(db.sizes.map(s => [s.id, s.name]));
  const totalStock = db.variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    category: db.category?.name ?? 'Uncategorized',
    description: db.description,
    price: db.price,
    compareAtPrice: db.compare_at_price ?? undefined,
    images: db.images
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => ({ src: img.src, alt: img.alt })),
    sizes: db.sizes
      .sort((a, b) => a.display_order - b.display_order)
      .map(s => s.name),
    colors: db.colors
      .sort((a, b) => a.display_order - b.display_order)
      .map(c => ({ name: c.name, hex: c.hex })),
    stock: totalStock,
    material: db.material ?? '',
    care: db.care
      .sort((a, b) => a.display_order - b.display_order)
      .map(c => c.instruction),
    details: db.details
      .sort((a, b) => a.display_order - b.display_order)
      .map(d => ({ label: d.label, value: d.value })),
    isFeatured: db.is_featured,
    isNew: db.is_new,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(*),
      variants:product_variants(*),
      details:product_details(*),
      care:product_care(*)
    `)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (products ?? []).map(mapDbProductToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(*),
      variants:product_variants(*),
      details:product_details(*),
      care:product_care(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching product:', error);
    return null;
  }

  return mapDbProductToProduct(product);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(*),
      variants:product_variants(*),
      details:product_details(*),
      care:product_care(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching product:', error);
    return null;
  }

  return mapDbProductToProduct(product);
}

export async function getNewArrivals(): Promise<Product[]> {
  const supabase = createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(*),
      variants:product_variants(*),
      details:product_details(*),
      care:product_care(*)
    `)
    .eq('is_new', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }

  return (products ?? []).map(mapDbProductToProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(*),
      variants:product_variants(*),
      details:product_details(*),
      care:product_care(*)
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  return (products ?? []).map(mapDbProductToProduct);
}

export async function getCategories(): Promise<string[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data ?? []).map(c => c.name);
}