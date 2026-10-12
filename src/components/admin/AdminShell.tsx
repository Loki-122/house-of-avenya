'use client';

/**
 * Admin shell: sidebar + top bar + page content.
 *
 * Rendered by the (dashboard) layout after the
 * server-side `requireAdmin()` check has passed.
 * Owns the mobile navigation state so the sidebar
 * drawer and the top-bar menu button stay in sync.
 */
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminSessionKeeper from './AdminSessionKeeper';
import { AdminIcon } from './AdminIcon';
import type { AdminSession } from '@/lib/admin-auth';

const SECTION_TITLES: { match: string; label: string }[] = [
  { match: '/admin/products', label: 'Products' },
  { match: '/admin/inventory', label: 'Inventory' },
  { match: '/admin/orders', label: 'Orders' },
  { match: '/admin/customers', label: 'Customers' },
  { match: '/admin/coupons', label: 'Coupons' },
  { match: '/admin/reviews', label: 'Reviews' },
  { match: '/admin/settings', label: 'Settings' },
];

function sectionForPath(pathname: string): string {
  const found = SECTION_TITLES.find((section) =>
    pathname.startsWith(section.match),
  );
  return found ? found.label : 'Dashboard';
}

export default function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const section = sectionForPath(pathname);

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-espresso">
      <AdminSessionKeeper />
      <AdminSidebar
        session={session}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-brand-antiqueGold/20 bg-brand-ivory/90 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-2 -ml-2 text-brand-espresso/70 transition-colors hover:bg-brand-antiqueGold/10 hover:text-brand-espresso lg:hidden"
            >
              <AdminIcon name="menu" />
            </button>

            <p className="text-sm text-brand-espresso/50">
              <span className="uppercase tracking-[0.25em] text-[0.625rem]">
                Admin
              </span>
              <span aria-hidden="true" className="mx-2.5 text-brand-antiqueGold">
                /
              </span>
              <span className="font-medium text-brand-espresso">{section}</span>
            </p>

            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <AdminIcon
                name="shield"
                size={14}
                className="text-brand-antiqueGoldDark"
              />
              <span className="max-w-[220px] truncate text-xs text-brand-espresso/55">
                {session.user.email ?? session.profile.email}
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
