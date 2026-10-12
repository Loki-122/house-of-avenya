'use client';

/**
 * Admin sidebar navigation.
 *
 * Fixed column on desktop; slide-in drawer on mobile.
 * Only the Dashboard section is live in this phase —
 * the remaining items point to clearly marked placeholder
 * pages so the navigation is complete without pretending
 * the features exist.
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminIcon, type AdminIconName } from './AdminIcon';
import AdminLogoutButton from './AdminLogoutButton';
import type { AdminSession } from '@/lib/admin-auth';

type NavItem = {
  name: string;
  href: string;
  icon: AdminIconName;
};

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
      { name: 'Products', href: '/admin/products', icon: 'products' },
      { name: 'Inventory', href: '/admin/inventory', icon: 'inventory' },
      { name: 'Orders', href: '/admin/orders', icon: 'orders' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: 'customers' },
      { name: 'Coupons', href: '/admin/coupons', icon: 'coupons' },
      { name: 'Reviews', href: '/admin/reviews', icon: 'reviews' },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', href: '/admin/settings', icon: 'settings' }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname.startsWith(href);
}

function initials(email: string | null): string {
  if (!email) return 'A';
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'A').toUpperCase();
}

export default function AdminSidebar({
  session,
  open,
  onClose,
}: {
  session: AdminSession;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const email = session.user.email ?? session.profile.email;

  const nav = (
    <>
      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGold">
          House of Avenya
        </p>
        <p className="mt-2 font-display text-xl font-light uppercase tracking-[0.08em] text-brand-ivory">
          Admin
        </p>
        <div className="mt-4 h-px w-12 bg-brand-antiqueGold/60" />
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mt-6 first:mt-0">
            <p className="px-3 pb-2 text-[0.625rem] font-medium uppercase tracking-[0.3em] text-brand-ivory/35">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-300',
                        active
                          ? 'bg-white/[0.07] text-brand-antiqueGoldLight'
                          : 'text-brand-ivory/60 hover:bg-white/[0.04] hover:text-brand-ivory',
                      ].join(' ')}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-brand-antiqueGold"
                        />
                      )}
                      <AdminIcon
                        name={item.icon}
                        size={17}
                        className={active ? 'text-brand-antiqueGold' : 'text-brand-ivory/40 group-hover:text-brand-ivory/60'}
                      />
                      <span>{item.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Signed-in admin */}
      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-antiqueGold/40 bg-brand-antiqueGold/10 font-display text-sm text-brand-antiqueGoldLight"
          >
            {initials(email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-brand-ivory/90">{email}</p>
            <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.25em] text-brand-antiqueGold">
              <AdminIcon name="shield" size={11} />
              Admin
            </p>
          </div>
        </div>
        <div className="mt-4">
          <AdminLogoutButton
            disabled={signingOut}
            onSigningOutChange={setSigningOut}
          />
        </div>
        <a
          href="/"
          className="mt-4 flex items-center gap-2 text-xs text-brand-ivory/40 transition-colors hover:text-brand-ivory/70"
        >
          <AdminIcon name="arrowLeft" size={13} />
          Back to storefront
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-espresso lg:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          'fixed inset-0 z-50 lg:hidden',
          open ? '' : 'pointer-events-none',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div
          className={[
            'absolute inset-0 bg-brand-espresso/60 backdrop-blur-[2px] transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={onClose}
        />
        <aside
          className={[
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-brand-espresso shadow-2xl transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute right-3 top-4 rounded-md p-2 text-brand-ivory/50 transition-colors hover:text-brand-ivory"
          >
            <AdminIcon name="close" />
          </button>
          {nav}
        </aside>
      </div>
    </>
  );
}
