import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminDashboardStats, LOW_STOCK_THRESHOLD } from '@/lib/admin-stats';
import { formatPrice } from '@/lib/format';
import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'House of Avenya admin dashboard.',
};

type StatCard = {
  label: string;
  value: string;
  hint: string;
  icon: AdminIconName;
  tone: 'gold' | 'green' | 'amber' | 'red';
};

const TONE_CLASSES: Record<StatCard['tone'], string> = {
  gold: 'bg-brand-antiqueGold/10 text-brand-antiqueGoldDark',
  green: 'bg-emerald-700/10 text-emerald-800',
  amber: 'bg-amber-500/10 text-amber-700',
  red: 'bg-brand-burgundy/10 text-brand-burgundy',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-burgundy/25 bg-brand-burgundy/[0.07] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-brand-burgundy">
        <AdminIcon name="xCircle" size={11} />
        Sold out
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/25 bg-amber-500/10 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-amber-700">
        <AdminIcon name="alertTriangle" size={11} />
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-700/[0.07] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-emerald-800">
      <AdminIcon name="checkCircle" size={11} />
      In stock
    </span>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const statCards: StatCard[] = [
    {
      label: 'Total Products',
      value: String(stats.totalProducts),
      hint: `${stats.totalVariants} size/colour variants`,
      icon: 'products',
      tone: 'gold',
    },
    {
      label: 'Active Products',
      value: String(stats.activeProducts),
      hint: 'Available to purchase',
      icon: 'checkCircle',
      tone: 'green',
    },
    {
      label: 'Low Stock',
      value: String(stats.lowStockProducts),
      hint: `${LOW_STOCK_THRESHOLD} units or fewer`,
      icon: 'alertTriangle',
      tone: 'amber',
    },
    {
      label: 'Out of Stock',
      value: String(stats.outOfStockProducts),
      hint: 'No units in any variant',
      icon: 'xCircle',
      tone: 'red',
    },
  ];

  const quickActions: { label: string; description: string; icon: AdminIconName; href: string }[] = [
    {
      label: 'Add Product',
      description: 'Add a new piece to the catalogue',
      icon: 'plus',
      href: '/admin/products',
    },
    {
      label: 'View Products',
      description: 'Browse the full product list',
      icon: 'grid',
      href: '/admin/products',
    },
    {
      label: 'Manage Inventory',
      description: 'Adjust stock across variants',
      icon: 'inventory',
      href: '/admin/inventory',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page heading */}
      <div className="border-b border-brand-antiqueGold/20 pb-8">
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-antiqueGoldDark">
          Overview
        </p>
        <h1 className="mt-3 font-display text-4xl font-light uppercase tracking-[0.02em] text-brand-espresso sm:text-5xl">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-espresso/55">
          The state of the House of Avenya catalogue at a glance —
          live from the database.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/50">
                {card.label}
              </p>
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE_CLASSES[card.tone]}`}
              >
                <AdminIcon name={card.icon} size={18} />
              </span>
            </div>
            <p className="mt-4 font-display text-4xl font-light text-brand-espresso">
              {card.value}
            </p>
            <p className="mt-1.5 text-xs text-brand-espresso/45">
              {card.hint}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-4 rounded-xl border border-brand-antiqueGold/20 bg-white px-5 py-4 transition-colors duration-300 hover:border-brand-antiqueGold/50 hover:bg-brand-cream"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-espresso text-brand-antiqueGold transition-colors duration-300 group-hover:bg-brand-espressoLight"
            >
              <AdminIcon name={action.icon} size={19} />
            </span>
            <span>
              <span className="block text-sm font-medium text-brand-espresso">
                {action.label}
              </span>
              <span className="mt-0.5 block text-xs text-brand-espresso/50">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent products */}
        <section
          aria-labelledby="recent-products-heading"
          className="rounded-xl border border-brand-antiqueGold/20 bg-white xl:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-brand-antiqueGold/15 px-6 py-4">
            <h2
              id="recent-products-heading"
              className="font-display text-lg font-light uppercase tracking-[0.06em] text-brand-espresso"
            >
              Recent Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-medium uppercase tracking-[0.2em] text-brand-antiqueGoldDark transition-colors hover:text-brand-espresso"
            >
              View all
            </Link>
          </div>

          {stats.recentProducts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-brand-espresso/50">
              No products in the catalogue yet.
            </p>
          ) : (
            <ul className="divide-y divide-brand-antiqueGold/10">
              {stats.recentProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md border border-brand-antiqueGold/20 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-brand-antiqueGold/20 bg-brand-cream"
                    >
                      <AdminIcon
                        name="products"
                        size={20}
                        className="text-brand-antiqueGoldDark"
                      />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-espresso">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                      {product.slug}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm text-brand-espresso/70">
                      {product.category ?? 'Uncategorized'}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-espresso/40">
                      Added {formatDate(product.createdAt)}
                    </p>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-medium text-brand-espresso">
                      {formatPrice(product.price)}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-espresso/40">
                      {product.stock} in stock
                    </p>
                  </div>
                  <StockBadge stock={product.stock} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Side column */}
        <div className="space-y-6">
          <section
            aria-labelledby="catalogue-heading"
            className="rounded-xl border border-brand-antiqueGold/20 bg-white"
          >
            <div className="border-b border-brand-antiqueGold/15 px-6 py-4">
              <h2
                id="catalogue-heading"
                className="font-display text-lg font-light uppercase tracking-[0.06em] text-brand-espresso"
              >
                Catalogue
              </h2>
            </div>
            <dl className="divide-y divide-brand-antiqueGold/10 px-6">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-brand-espresso/55">Categories</dt>
                <dd className="font-display text-xl font-light text-brand-espresso">
                  {stats.totalCategories}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-brand-espresso/55">Variants</dt>
                <dd className="font-display text-xl font-light text-brand-espresso">
                  {stats.totalVariants}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-brand-espresso/55">
                  Inventory value
                </dt>
                <dd className="font-display text-xl font-light text-brand-espresso">
                  {formatPrice(stats.inventoryValue)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Orders — explicitly marked as not yet existing.
              No sales figures are fabricated. */}
          <section
            aria-labelledby="orders-status-heading"
            className="rounded-xl border border-dashed border-brand-antiqueGold/35 bg-brand-cream px-6 py-5"
          >
            <div className="flex items-center gap-2.5">
              <AdminIcon
                name="orders"
                size={17}
                className="text-brand-antiqueGoldDark"
              />
              <h2
                id="orders-status-heading"
                className="font-display text-lg font-light uppercase tracking-[0.06em] text-brand-espresso"
              >
                Orders
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-espresso/60">
              The order system is coming in a later phase. Order
              tracking, fulfilment and sales reporting will appear
              here once orders exist — nothing is counted until
              then.
            </p>
            <p className="mt-4 text-[0.625rem] font-medium uppercase tracking-[0.3em] text-brand-antiqueGoldDark">
              Coming soon
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
