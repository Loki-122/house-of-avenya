import type { Metadata } from 'next';
import { requireCustomer } from '@/lib/auth';
import AddressesClient from './AddressesClient';

export const metadata: Metadata = {
  title: 'Addresses — House of Avenya',
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const session = await requireCustomer();

  let initialAddresses: any[] = [];

  try {
    const supabase = (await import('@/lib/supabase-server')).createSupabaseServerClient();
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      initialAddresses = data;
    }
  } catch {
    // Server-side fetch failed; start empty.
  }

  return <AddressesClient initialAddresses={initialAddresses} />;
}
