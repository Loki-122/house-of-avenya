import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCustomerSessionWithToken } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import PageIntro from '@/components/PageIntro';
import CheckoutClient from './CheckoutClient';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Checkout — House of Avenya',
  description: 'Complete your House of Avenya order: confirm your pieces, delivery address, and proceed to payment.',
};

export default async function CheckoutPage() {
  const session = await getCustomerSessionWithToken();
  if (!session) {
    redirect('/login?returnTo=/checkout');
  }

  let initialAddresses: any[] = [];

  try {
    const supabase = createSupabaseServerClient(session.accessToken);
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

  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="Checkout"
          title="Complete Your Order"
          description="Confirm the pieces in your bag, choose a delivery address, and proceed to payment. Your bag is held on this device until you are ready."
        />

        <section aria-labelledby="checkout-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <CheckoutClient initialAddresses={initialAddresses} />
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}