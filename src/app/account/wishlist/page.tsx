import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { requireCustomer } from '@/lib/auth';
import { CUSTOMER_SESSION_COOKIE } from '@/lib/customer-cookie';
import WishlistClient from './WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist — House of Avenya',
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const session = await requireCustomer();

  let initialItems: any[] = [];

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    const supabase = (await import('@/lib/supabase-server')).createSupabaseServerClient(accessToken);
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, product_id, products ( id, name, slug, price, product_images ( src ) )')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Wishlist server query error:', error.message);
    }

    if (data) {
      initialItems = data.map((row: any) => ({
        id: row.id,
        product_id: row.product_id,
        products: {
          id: row.products.id,
          name: row.products.name,
          slug: row.products.slug,
          price: row.products.price,
          product_images: row.products.product_images ?? [],
        },
      }));
    }
  } catch (err) {
    console.error('Failed to load wishlist server-side:', err);
  }

  return <WishlistClient initialItems={initialItems} />;
}
