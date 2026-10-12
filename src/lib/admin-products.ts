'use server';

/**
 * Server actions for admin product management.
 *
 * Every mutation in this file:
 *  1. Reads the admin session cookie directly.
 *  2. Verifies the access token with Supabase Auth.
 *  3. Checks profiles.role = 'admin' under Row Level Security.
 *  4. Uses the user's own JWT in the Authorization header so
 *      PostgREST evaluates the request as `authenticated` and
 *      the admin RLS policies apply.
 *
 * The service-role key is never used in the application,
 * so RLS is the authoritative gate for every write.
 */

import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './admin-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ------------------------------------------------------------------ */
/* Low-level authenticated fetch helper                               */
/* ------------------------------------------------------------------ */

async function getAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function adminApi<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; error: { message?: string } | null }> {
  const accessToken = await getAccessToken();

  const headers: HeadersInit = {
    apikey: supabaseAnonKey!,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...init.headers,
  };

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  // Read the body once so we can handle empty / non-JSON responses
  // without throwing "Unexpected end of JSON input".
  const rawText = await response.text();

  let error: { message?: string } | null = null;
  let data: T = undefined as T;

  if (response.ok) {
    if (response.status !== 204 && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText) as T;
      } catch {
        error = { message: `Unexpected response body from ${path}` };
      }
    }
  } else {
    if (rawText.trim().length > 0) {
      try {
        const err = JSON.parse(rawText) as {
          message?: string;
          hint?: string;
          details?: string;
          code?: string;
        };
        error = {
          message:
            err.message ??
            err.hint ??
            err.details ??
            (err.code ? `PostgREST error ${err.code}` : undefined) ??
            `Request failed (${response.status})`,
        };
      } catch {
        error = { message: rawText.trim() };
      }
    } else {
      error = { message: `Request failed (${response.status})` };
    }
  }

  return { data, error };
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AdminProduct = {
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: { name: string; slug: string } | null;
  images: { id: string; src: string; alt: string; display_order: number }[];
  colors: { id: string; name: string; hex: string; display_order: number }[];
  sizes: { id: string; name: string; display_order: number }[];
  variants: {
    id: string;
    size_id: string | null;
    color_id: string | null;
    stock: number;
    sku: string | null;
  }[];
  details: { id: string; label: string; value: string; display_order: number }[];
  care: { id: string; instruction: string; display_order: number }[];
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ProductVariantInput = {
  size: string;
  color: string;
  stock: number;
  sku?: string;
};

export type ProductDetailInput = { label: string; value: string };
export type ProductCareInput = { instruction: string };
export type ProductImageInput = { src: string; alt: string };

/* ------------------------------------------------------------------ */
/* Admin authorization gate                                            */
/* ------------------------------------------------------------------ */

async function requireAdminToken(): Promise<string> {
  const token = await getAccessToken();

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!userResponse.ok) throw new Error('Session expired');

  const user = (await userResponse.json()) as { id: string };

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${user.id}`,
    {
      headers: {
        apikey: supabaseAnonKey!,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (!profileResponse.ok) throw new Error('Failed to verify admin role');

  const profiles = (await profileResponse.json()) as { role: string }[];
  if (!profiles?.[0] || profiles[0].role !== 'admin') {
    throw new Error('Forbidden — admin access required');
  }

  return token;
}

/* ------------------------------------------------------------------ */
/* Read operations                                                     */
/* ------------------------------------------------------------------ */

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminProduct[]>(
    `/rest/v1/products?select=*,category:categories(name,slug),images:product_images(*),colors:product_colors(*),sizes:product_sizes(*),variants:product_variants(*),details:product_details(*),care:product_care(*)&order=created_at.desc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) throw new Error(error.message ?? 'Failed to fetch products');
  return data ?? [];
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminCategory[]>(
    `/rest/v1/categories?select=id,name,slug&order=display_order.asc,name.asc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) throw new Error(error.message ?? 'Failed to fetch categories');
  return data ?? [];
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminProduct[]>(
    `/rest/v1/products?select=*,category:categories(name,slug),images:product_images(*),colors:product_colors(*),sizes:product_sizes(*),variants:product_variants(*),details:product_details(*),care:product_care(*)&id=eq.${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) return null;
  return data?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Write operations                                                    */
/* ------------------------------------------------------------------ */

async function deleteRelated(token: string, productId: string, table: string) {
  const { error } = await adminApi(`/rest/v1/${table}?product_id=eq.${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    console.error(`Failed to delete ${table}:`, error.message);
  }
}

export async function createProduct(form: FormData): Promise<{ id: string }> {
  const token = await requireAdminToken();

  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  const category_id = String(form.get('category_id') ?? '') || null;
  const description = String(form.get('description') ?? '').trim();
  const price = Math.round(parseFloat(String(form.get('price') ?? '0')) || 0);
  const compare_at_price = form.get('compare_at_price')
    ? Math.round(parseFloat(String(form.get('compare_at_price'))) || 0)
    : null;
  const material = String(form.get('material') ?? '').trim() || null;
  const is_featured = form.get('is_featured') === 'on';
  const is_new = form.get('is_new') === 'on';
  const is_active = form.get('is_active') !== 'off';

  if (!name) throw new Error('Product name is required');
  if (!slug) throw new Error('Slug is required');
  if (!description) throw new Error('Description is required');
  if (price <= 0) throw new Error('Price must be greater than 0');

  // 1. Create product
  // Ask PostgREST to return the inserted row(s) instead of an empty
  // body. Without `Prefer: return=representation` a single-row INSERT
  // comes back as 201 with no JSON body, so `data` would be undefined
  // and `product.id` would throw "Cannot read properties of undefined".
  const { data: product, error: productError } = await adminApi<
    { id: string }[]
  >(`/rest/v1/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name,
      slug,
      category_id,
      description,
      price,
      compare_at_price,
      material,
      is_featured,
      is_new,
      is_active,
    }),
  });

  if (productError) throw new Error(productError.message ?? 'Failed to create product');
  const inserted = Array.isArray(product) ? product[0] : product;
  const productId = inserted?.id;
  if (!productId) {
    throw new Error('Product was created but no id was returned by the server.');
  }

  // 2. Create sizes
  const sizes = JSON.parse(String(form.get('sizes') ?? '[]')) as { name: string }[];
  if (sizes.length > 0) {
    const { error: sizesError } = await adminApi(
      `/rest/v1/product_sizes`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          sizes.map((s, i) => ({ product_id: productId, name: s.name, display_order: i })),
        ),
      },
    );
    if (sizesError) throw new Error(sizesError.message ?? 'Failed to create sizes');
  }

  // 3. Create colors
  const colors = JSON.parse(String(form.get('colors') ?? '[]')) as { name: string; hex: string }[];
  if (colors.length > 0) {
    const { error: colorsError } = await adminApi(
      `/rest/v1/product_colors`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          colors.map((c, i) => ({ product_id: productId, name: c.name, hex: c.hex, display_order: i })),
        ),
      },
    );
    if (colorsError) throw new Error(colorsError.message ?? 'Failed to create colors');
  }

  // 4. Create variants
  const variants = JSON.parse(String(form.get('variants') ?? '[]')) as ProductVariantInput[];
  if (variants.length > 0) {
    const { data: allSizes, error: sizesFetchError } = await adminApi<{ id: string; name: string }[]>(
      `/rest/v1/product_sizes?select=id,name&product_id=eq.${productId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (sizesFetchError) throw new Error(sizesFetchError.message ?? 'Failed to load sizes');

    const { data: allColors, error: colorsFetchError } = await adminApi<{ id: string; name: string }[]>(
      `/rest/v1/product_colors?select=id,name&product_id=eq.${productId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (colorsFetchError) throw new Error(colorsFetchError.message ?? 'Failed to load colors');

    const sizeMap = new Map((allSizes ?? []).map(s => [s.name, s.id]));
    const colorMap = new Map((allColors ?? []).map(c => [c.name, c.id]));

    const variantRows = variants
      .map(v => ({
        product_id: productId,
        size_id: sizeMap.get(v.size) ?? null,
        color_id: colorMap.get(v.color) ?? null,
        stock: v.stock,
        sku: v.sku || null,
      }))
      .filter(v => v.size_id || v.color_id);

    if (variantRows.length > 0) {
      const { error: variantsError } = await adminApi(`/rest/v1/product_variants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(variantRows),
      });
      if (variantsError) throw new Error(variantsError.message ?? 'Failed to create variants');
    }
  }

  // 5. Create details
  const details = JSON.parse(String(form.get('details') ?? '[]')) as ProductDetailInput[];
  if (details.length > 0) {
    const { error: detailsError } = await adminApi(
      `/rest/v1/product_details`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          details.map((d, i) => ({ product_id: productId, label: d.label, value: d.value, display_order: i })),
        ),
      },
    );
    if (detailsError) throw new Error(detailsError.message ?? 'Failed to create details');
  }

  // 6. Create care instructions
  const care = JSON.parse(String(form.get('care') ?? '[]')) as ProductCareInput[];
  if (care.length > 0) {
    const { error: careError } = await adminApi(
      `/rest/v1/product_care`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          care.map((c, i) => ({ product_id: productId, instruction: c.instruction, display_order: i })),
        ),
      },
    );
    if (careError) throw new Error(careError.message ?? 'Failed to create care instructions');
  }

  // 7. Create images
  const images = JSON.parse(String(form.get('images') ?? '[]')) as ProductImageInput[];
  if (images.length > 0) {
    const { error: imagesError } = await adminApi(
      `/rest/v1/product_images`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          images.map((img, i) => ({ product_id: productId, src: img.src, alt: img.alt || name, display_order: i })),
        ),
      },
    );
    if (imagesError) throw new Error(imagesError.message ?? 'Failed to create images');
  }

  return { id: productId };
}

export async function updateProduct(id: string, form: FormData): Promise<void> {
  const token = await requireAdminToken();

  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  const category_id = String(form.get('category_id') ?? '') || null;
  const description = String(form.get('description') ?? '').trim();
  const price = Math.round(parseFloat(String(form.get('price') ?? '0')) || 0);
  const compare_at_price = form.get('compare_at_price')
    ? Math.round(parseFloat(String(form.get('compare_at_price'))) || 0)
    : null;
  const material = String(form.get('material') ?? '').trim() || null;
  const is_featured = form.get('is_featured') === 'on';
  const is_new = form.get('is_new') === 'on';
  const is_active = form.get('is_active') !== 'off';

  if (!name) throw new Error('Product name is required');
  if (!slug) throw new Error('Slug is required');
  if (!description) throw new Error('Description is required');
  if (price <= 0) throw new Error('Price must be greater than 0');

  // 1. Update product
  const { error: updateError } = await adminApi(`/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      slug,
      category_id,
      description,
      price,
      compare_at_price,
      material,
      is_featured,
      is_new,
      is_active,
    }),
  });
  if (updateError) throw new Error(updateError.message ?? 'Failed to update product');

  // 2. Replace sizes
  await deleteRelated(token, id, 'product_sizes');
  const sizes = JSON.parse(String(form.get('sizes') ?? '[]')) as { name: string }[];
  if (sizes.length > 0) {
    const { error: sizesError } = await adminApi(
      `/rest/v1/product_sizes`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          sizes.map((s, i) => ({ product_id: id, name: s.name, display_order: i })),
        ),
      },
    );
    if (sizesError) throw new Error(sizesError.message ?? 'Failed to update sizes');
  }

  // 3. Replace colors
  await deleteRelated(token, id, 'product_colors');
  const colors = JSON.parse(String(form.get('colors') ?? '[]')) as { name: string; hex: string }[];
  if (colors.length > 0) {
    const { error: colorsError } = await adminApi(
      `/rest/v1/product_colors`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          colors.map((c, i) => ({ product_id: id, name: c.name, hex: c.hex, display_order: i })),
        ),
      },
    );
    if (colorsError) throw new Error(colorsError.message ?? 'Failed to update colors');
  }

  // 4. Replace variants
  await deleteRelated(token, id, 'product_variants');
  const variants = JSON.parse(String(form.get('variants') ?? '[]')) as ProductVariantInput[];
  if (variants.length > 0) {
    const { data: allSizes, error: sizesFetchError } = await adminApi<{ id: string; name: string }[]>(
      `/rest/v1/product_sizes?select=id,name&product_id=eq.${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (sizesFetchError) throw new Error(sizesFetchError.message ?? 'Failed to load sizes');

    const { data: allColors, error: colorsFetchError } = await adminApi<{ id: string; name: string }[]>(
      `/rest/v1/product_colors?select=id,name&product_id=eq.${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (colorsFetchError) throw new Error(colorsFetchError.message ?? 'Failed to load colors');

    const sizeMap = new Map((allSizes ?? []).map(s => [s.name, s.id]));
    const colorMap = new Map((allColors ?? []).map(c => [c.name, c.id]));

    const variantRows = variants
      .map(v => ({
        product_id: id,
        size_id: sizeMap.get(v.size) ?? null,
        color_id: colorMap.get(v.color) ?? null,
        stock: v.stock,
        sku: v.sku || null,
      }))
      .filter(v => v.size_id || v.color_id);

    if (variantRows.length > 0) {
      const { error: variantsError } = await adminApi(`/rest/v1/product_variants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(variantRows),
      });
      if (variantsError) throw new Error(variantsError.message ?? 'Failed to update variants');
    }
  }

  // 5. Replace details
  await deleteRelated(token, id, 'product_details');
  const details = JSON.parse(String(form.get('details') ?? '[]')) as ProductDetailInput[];
  if (details.length > 0) {
    const { error: detailsError } = await adminApi(
      `/rest/v1/product_details`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          details.map((d, i) => ({ product_id: id, label: d.label, value: d.value, display_order: i })),
        ),
      },
    );
    if (detailsError) throw new Error(detailsError.message ?? 'Failed to update details');
  }

  // 6. Replace care instructions
  await deleteRelated(token, id, 'product_care');
  const care = JSON.parse(String(form.get('care') ?? '[]')) as ProductCareInput[];
  if (care.length > 0) {
    const { error: careError } = await adminApi(
      `/rest/v1/product_care`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          care.map((c, i) => ({ product_id: id, instruction: c.instruction, display_order: i })),
        ),
      },
    );
    if (careError) throw new Error(careError.message ?? 'Failed to update care instructions');
  }

  // 7. Replace images
  await deleteRelated(token, id, 'product_images');
  const images = JSON.parse(String(form.get('images') ?? '[]')) as ProductImageInput[];
  if (images.length > 0) {
    const { error: imagesError } = await adminApi(
      `/rest/v1/product_images`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          images.map((img, i) => ({ product_id: id, src: img.src, alt: img.alt || name, display_order: i })),
        ),
      },
    );
    if (imagesError) throw new Error(imagesError.message ?? 'Failed to update images');
  }
}

export async function archiveProduct(id: string): Promise<void> {
  const token = await requireAdminToken();
  const { error } = await adminApi(`/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_active: false }),
  });
  if (error) throw new Error(error.message ?? 'Failed to archive product');
}

export async function unarchiveProduct(id: string): Promise<void> {
  const token = await requireAdminToken();
  const { error } = await adminApi(`/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_active: true }),
  });
  if (error) throw new Error(error.message ?? 'Failed to unarchive product');
}

export async function deleteProduct(id: string): Promise<void> {
  const token = await requireAdminToken();
  const { error } = await adminApi(`/rest/v1/products?id=eq.${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error(error.message ?? 'Failed to delete product');
}

/* ------------------------------------------------------------------ */
/* Inventory — read + write                                            */
/* ------------------------------------------------------------------ */

export type AdminInventoryVariant = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_is_active: boolean;
  size_id: string | null;
  size_name: string | null;
  color_id: string | null;
  color_name: string | null;
  color_hex: string | null;
  stock: number;
  sku: string | null;
  updated_at: string | null;
};

/**
 * Every variant across the catalogue, joined to its product and its
 * size/colour labels.
 */
export async function getAdminInventory(): Promise<AdminInventoryVariant[]> {
  const token = await requireAdminToken();

  const { data, error } = await adminApi<AdminInventoryVariant[]>(
    `/rest/v1/product_variants?select=id,product_id,stock,sku,updated_at,product:products(id,name,slug,is_active),size:product_sizes(id,name),color:product_colors(id,name,hex)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (error) throw new Error(error.message ?? 'Failed to load inventory');
  return data ?? [];
}

/** Update a single variant's stock level. */
export async function updateVariantStock(
  variantId: string,
  stock: number,
): Promise<void> {
  const token = await requireAdminToken();
  const { error } = await adminApi(
    `/rest/v1/product_variants?id=eq.${variantId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock: Math.max(0, Math.round(stock)) }),
    },
  );
  if (error) throw new Error(error.message ?? 'Failed to update stock');
}

/** Update stock for many variants in one call. */
export async function bulkUpdateVariantStock(
  rows: { id: string; stock: number }[],
): Promise<void> {
  if (rows.length === 0) return;
  const token = await requireAdminToken();

  // PATCH one at a time — PostgREST has no batch-by-id helper and a
  // single payload with no id filter would overwrite every row.
  let firstError: string | null = null;
  for (const row of rows) {
    const { error } = await adminApi(
      `/rest/v1/product_variants?id=eq.${row.id}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock: Math.max(0, Math.round(row.stock)) }),
      },
    );
    if (error && firstError === null) {
      firstError = error.message ?? 'Failed to update stock';
    }
  }
  if (firstError) throw new Error(firstError);
}
