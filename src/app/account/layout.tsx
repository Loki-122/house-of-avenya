import { redirect } from 'next/navigation';
import { requireCustomer } from '@/lib/auth';
import AccountNavigation from '@/components/AccountNavigation';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCustomer();

  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 py-10 lg:flex-row lg:gap-12">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl border border-brand-espresso/10 bg-white p-4 shadow-sm">
              <div className="mb-4 px-2">
                <p className="font-sans text-[0.625rem] uppercase tracking-[0.25em] text-brand-espresso/50">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-sm font-medium text-brand-espresso">
                  {session.profile.full_name ?? session.profile.email}
                </p>
              </div>
              <AccountNavigation />
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <div className="rounded-xl border border-brand-espresso/10 bg-white p-6 sm:p-8 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
