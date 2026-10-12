import type { Metadata } from 'next';
import { requireCustomer } from '@/lib/auth';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Account — House of Avenya',
  description: 'Manage your House of Avenya account.',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await requireCustomer();

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-light uppercase tracking-[0.08em] text-brand-espresso">
        Welcome, {session.profile.full_name?.split(' ')[0] ?? 'there'}
      </h1>
      <p className="mt-2 text-sm text-brand-espresso/55">
        Manage your orders, addresses, wishlist and account settings from here.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/account/orders"
          className="group rounded-lg border border-brand-espresso/10 bg-brand-cream/40 p-6 transition-colors hover:border-brand-antiqueGold/30 hover:bg-brand-cream"
        >
          <div className="flex items-center gap-3 text-brand-antiqueGoldDark transition-colors group-hover:text-brand-terracotta">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="font-display text-lg uppercase tracking-[0.06em]">Orders</span>
          </div>
          <p className="mt-3 text-sm text-brand-espresso/60">
            View your order history and track current deliveries.
          </p>
        </Link>

        <Link
          href="/account/addresses"
          className="group rounded-lg border border-brand-espresso/10 bg-brand-cream/40 p-6 transition-colors hover:border-brand-antiqueGold/30 hover:bg-brand-cream"
        >
          <div className="flex items-center gap-3 text-brand-antiqueGoldDark transition-colors group-hover:text-brand-terracotta">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="font-display text-lg uppercase tracking-[0.06em]">Addresses</span>
          </div>
          <p className="mt-3 text-sm text-brand-espresso/60">
            Manage your delivery addresses for faster checkout.
          </p>
        </Link>

        <Link
          href="/account/wishlist"
          className="group rounded-lg border border-brand-espresso/10 bg-brand-cream/40 p-6 transition-colors hover:border-brand-antiqueGold/30 hover:bg-brand-cream"
        >
          <div className="flex items-center gap-3 text-brand-antiqueGoldDark transition-colors group-hover:text-brand-terracotta">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="font-display text-lg uppercase tracking-[0.06em]">Wishlist</span>
          </div>
          <p className="mt-3 text-sm text-brand-espresso/60">
            View and manage your saved items.
          </p>
        </Link>

        <Link
          href="/account/settings"
          className="group rounded-lg border border-brand-espresso/10 bg-brand-cream/40 p-6 transition-colors hover:border-brand-antiqueGold/30 hover:bg-brand-cream"
        >
          <div className="flex items-center gap-3 text-brand-antiqueGoldDark transition-colors group-hover:text-brand-terracotta">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="font-display text-lg uppercase tracking-[0.06em]">Settings</span>
          </div>
          <p className="mt-3 text-sm text-brand-espresso/60">
            Update your profile information and preferences.
          </p>
        </Link>
      </div>
    </div>
  );
}
