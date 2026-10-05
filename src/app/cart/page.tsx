import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import CartView from '@/components/CartView';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Your Bag — House of Avenya',
  description: 'Review the House of Avenya pieces in your bag before checking out.',
};

export default function CartPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="Your Bag"
          title="Review Your Order"
          description="Everything you have set aside, with the size and colour you chose. Held on this device until you are ready to check out."
        />

        <section aria-labelledby="cart-bag-heading" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="border-b border-brand-antiqueGold/25 pb-8">
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
                Bagged Pieces
              </p>
              <h2
                id="cart-bag-heading"
                className="mt-4 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
              >
                Your Bag
              </h2>
            </div>

            <div className="mt-12">
              <CartView />
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}