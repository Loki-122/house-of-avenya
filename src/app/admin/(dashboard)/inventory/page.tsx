'use client';

/**
 * Admin inventory management page.
 *
 * Shows every size/colour variant with its stock level, SKU and
 * last-updated timestamp. Supports inline stock edits and bulk
 * updates, with low-stock and sold-out alerts.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAdminInventory,
  updateVariantStock,
  bulkUpdateVariantStock,
  type AdminInventoryVariant,
} from '@/lib/admin-products';
import { AdminIcon } from '@/components/admin/AdminIcon';

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortOption = 'product_asc' | 'product_desc' | 'stock_asc' | 'stock_desc' | 'updated_desc' | 'updated_asc';

const LOW_STOCK_THRESHOLD = 5;

function stockStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function StatusBadge({ status }: { status: 'in_stock' | 'low_stock' | 'out_of_stock' }) {
  if (status === 'out_of_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-burgundy/25 bg-brand-burgundy/[0.07] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-brand-burgundy">
        <AdminIcon name="xCircle" size={11} />
        Sold out
      </span>
    );
  }
  if (status === 'low_stock') {
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

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-espresso/60 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-brand-antiqueGold/25 bg-white p-8">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-brand-antiqueGold/30 bg-brand-cream">
          <AdminIcon
            name={danger ? 'alertTriangle' : 'clock'}
            size={20}
            className={danger ? 'text-brand-burgundy' : 'text-brand-antiqueGoldDark'}
          />
        </div>
        <h3 className="font-display text-center text-xl font-light uppercase tracking-wide text-brand-espresso">
          {title}
        </h3>
        <p className="mt-3 text-center text-sm leading-relaxed text-brand-espresso/60">
          {description}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-brand-antiqueGold/30 px-5 py-2.5 text-sm font-medium text-brand-espresso/70 transition-colors hover:bg-brand-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
              danger
                ? 'border border-brand-burgundy/40 bg-brand-burgundy text-brand-ivory hover:bg-brand-burgundy/90'
                : 'border border-brand-antiqueGold/40 bg-brand-espresso text-brand-ivory hover:bg-brand-espressoLight'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<AdminInventoryVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockStatus>('all');
  const [sort, setSort] = useState<SortOption>('stock_asc');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = [...inventory];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.product_name.toLowerCase().includes(q) ||
          v.product_slug.toLowerCase().includes(q) ||
          (v.sku && v.sku.toLowerCase().includes(q)) ||
          (v.size_name && v.size_name.toLowerCase().includes(q)) ||
          (v.color_name && v.color_name.toLowerCase().includes(q)),
      );
    }

    if (stockFilter !== 'all') {
      result = result.filter((v) => stockStatus(v.stock) === stockFilter);
    }

    switch (sort) {
      case 'product_desc':
        result.sort((a, b) => b.product_name.localeCompare(a.product_name));
        break;
      case 'stock_asc':
        result.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock_desc':
        result.sort((a, b) => b.stock - a.stock);
        break;
      case 'updated_desc':
        result.sort((a, b) => {
          const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return tb - ta;
        });
        break;
      case 'updated_asc':
        result.sort((a, b) => {
          const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return ta - tb;
        });
        break;
      default:
        result.sort((a, b) => a.product_name.localeCompare(b.product_name));
    }

    return result;
  }, [inventory, search, stockFilter, sort]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const outOfStock = inventory.filter((v) => v.stock <= 0).length;
    const lowStock = inventory.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD).length;
    const inStock = total - outOfStock - lowStock;
    return { total, inStock, lowStock, outOfStock };
  }, [inventory]);

  function startEdit(variant: AdminInventoryVariant) {
    setEditingId(variant.id);
    setEditStock(String(variant.stock));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStock('');
  }

  async function saveEdit(variantId: string) {
    const parsed = parseInt(editStock, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError('Stock must be a non-negative number');
      return;
    }
    setSavingId(variantId);
    setError(null);
    try {
      await updateVariantStock(variantId, parsed);
      setInventory((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: parsed, updated_at: new Date().toISOString() } : v)),
      );
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  }

  async function handleBulkSave() {
    const rows = inventory
      .filter((v) => dirtyIds.has(v.id))
      .map((v) => ({ id: v.id, stock: v.stock }));

    if (rows.length === 0) return;

    setSavingAll(true);
    setError(null);
    try {
      await bulkUpdateVariantStock(rows);
      setDirtyIds(new Set());
      setConfirmBulk(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSavingAll(false);
    }
  }

  function updateLocalStock(variantId: string, value: string) {
    const parsed = parseInt(value, 10);
    const stock = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setInventory((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, stock } : v)),
    );
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(variantId);
      return next;
    });
  }

  const dirtyCount = dirtyIds.size;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.5em] text-brand-antiqueGoldDark">
            Catalogue
          </p>
          <h1 className="mt-3 font-display text-4xl font-light uppercase tracking-[0.02em] text-brand-espresso sm:text-5xl">
            Inventory
          </h1>
          <p className="mt-2.5 text-sm text-brand-espresso/55">
            {inventory.length} variant{inventory.length !== 1 ? 's' : ''} across the collection
          </p>
        </div>
        {dirtyCount > 0 && (
          <button
            type="button"
            onClick={() => setConfirmBulk(true)}
            className="inline-flex items-center gap-2.5 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight"
          >
            <AdminIcon name="check" size={16} />
            Save {dirtyCount} change{dirtyCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-brand-antiqueGold/20 bg-white px-5 py-4">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/50">
            Total variants
          </p>
          <p className="mt-1 font-mono text-2xl text-brand-espresso">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-700/20 bg-white px-5 py-4">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/50">
            In stock
          </p>
          <p className="mt-1 font-mono text-2xl text-emerald-800">{stats.inStock}</p>
        </div>
        <div className="rounded-xl border border-amber-600/25 bg-white px-5 py-4">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/50">
            Low stock
          </p>
          <p className="mt-1 font-mono text-2xl text-amber-700">{stats.lowStock}</p>
        </div>
        <div className="rounded-xl border border-brand-burgundy/25 bg-white px-5 py-4">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/50">
            Sold out
          </p>
          <p className="mt-1 font-mono text-2xl text-brand-burgundy">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-brand-antiqueGold/20 bg-white p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="search"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Search
          </label>
          <div className="relative">
            <AdminIcon
              name="inventory"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-espresso/35"
            />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, SKU, size or colour…"
              className="w-full rounded-md border border-brand-espresso/15 bg-white pl-10 pr-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="stock"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Stock status
          </label>
          <select
            id="stock"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockStatus)}
            className="rounded-md border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
          >
            <option value="all">All</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Sold out</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="sort"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
          >
            <option value="stock_asc">Stock: low to high</option>
            <option value="stock_desc">Stock: high to low</option>
            <option value="product_asc">Product A – Z</option>
            <option value="product_desc">Product Z – A</option>
            <option value="updated_desc">Last updated</option>
            <option value="updated_asc">Last updated (oldest)</option>
          </select>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-5 py-4"
        >
          <AdminIcon
            name="xCircle"
            size={18}
            className="mt-0.5 shrink-0 text-brand-burgundy"
          />
          <p className="text-sm text-brand-burgundy">{error}</p>
        </div>
      )}

      {/* Inventory table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-brand-antiqueGold/20 bg-white">
        {loading ? (
          <div className="flex items-center justify-center px-6 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-antiqueGold border-t-transparent" />
            <span className="ml-3 text-sm text-brand-espresso/55">
              Loading inventory…
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-antiqueGold/25 bg-brand-cream">
              <AdminIcon
                name="inventory"
                size={28}
                className="text-brand-antiqueGoldDark"
              />
            </div>
            <p className="mt-5 text-sm text-brand-espresso/55">
              {inventory.length === 0
                ? 'No variants found in the catalogue.'
                : 'No variants match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-antiqueGold/15 bg-brand-cream/40">
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Product
                  </th>
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Variant
                  </th>
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    SKU
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Stock
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Updated
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-antiqueGold/10">
                {filtered.map((variant) => {
                  const isEditing = editingId === variant.id;
                  const isDirty = dirtyIds.has(variant.id);
                  const status = stockStatus(variant.stock);

                  return (
                    <tr
                      key={variant.id}
                      className={`transition-colors duration-300 ${
                        isDirty ? 'bg-brand-antiqueGold/[0.04]' : 'hover:bg-brand-cream/50'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-display text-base font-light uppercase tracking-wide text-brand-espresso">
                          {variant.product_name}
                        </p>
                        <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                          {variant.product_slug}
                        </p>
                        {!variant.product_is_active && (
                          <span className="mt-1 inline-block rounded-full border border-brand-espresso/15 bg-brand-espresso/5 px-2 py-0.5 text-[0.5rem] font-medium uppercase tracking-[0.15em] text-brand-espresso/50">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {variant.color_name && variant.color_hex && (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-brand-espresso/10"
                              style={{ backgroundColor: variant.color_hex }}
                            />
                          )}
                          <span className="text-sm text-brand-espresso/80">
                            {[variant.size_name, variant.color_name].filter(Boolean).join(' / ') || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="font-mono text-xs text-brand-espresso/60">
                          {variant.sku ?? '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            min="0"
                            className="w-20 rounded-md border border-brand-antiqueGold px-2 py-1.5 text-center font-mono text-sm text-brand-espresso focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                            autoFocus
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={`font-mono text-sm ${
                                status === 'out_of_stock'
                                  ? 'text-brand-burgundy'
                                  : status === 'low_stock'
                                  ? 'text-amber-700'
                                  : 'text-brand-espresso/80'
                              }`}
                            >
                              {variant.stock}
                            </span>
                            <StatusBadge status={status} />
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        {!isEditing && <StatusBadge status={status} />}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-brand-espresso/50">
                        {formatDate(variant.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(variant.id)}
                              disabled={savingId === variant.id}
                              className="rounded-md border border-brand-antiqueGold/30 px-3 py-2 text-xs font-medium text-brand-espresso/70 transition-colors hover:bg-brand-cream disabled:opacity-50"
                            >
                              {savingId === variant.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingId === variant.id}
                              className="rounded-md border border-brand-espresso/15 px-3 py-2 text-xs font-medium text-brand-espresso/50 transition-colors hover:bg-brand-cream disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(variant)}
                              className="rounded-md border border-brand-antiqueGold/30 px-3.5 py-2 text-xs font-medium text-brand-espresso/70 transition-colors duration-300 hover:bg-brand-cream hover:text-brand-espresso"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk save confirmation */}
      {confirmBulk && (
        <ConfirmDialog
          title={`Update ${dirtyCount} variant${dirtyCount !== 1 ? 's' : ''}?`}
          description="This will update the stock levels for all changed variants. This action cannot be undone."
          confirmLabel={savingAll ? 'Saving…' : 'Save all changes'}
          onConfirm={handleBulkSave}
          onCancel={() => setConfirmBulk(false)}
        />
      )}
    </div>
  );
}
