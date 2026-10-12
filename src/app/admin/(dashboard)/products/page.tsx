'use client';

/**
 * Admin product management page — premium editorial redesign.
 *
 * Shows the full product catalogue with search, category
 * filter, stock-status filter, sort, and actions for each
 * product. Add/Edit opens a modal form; archive and delete
 * require explicit confirmation.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getAdminProducts,
  getAdminCategories,
  archiveProduct,
  unarchiveProduct,
  deleteProduct,
  type AdminProduct,
  type AdminCategory,
} from '@/lib/admin-products';
import { formatPrice } from '@/lib/format';
import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';
import ProductModal from './_components/ProductModal';

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc';

const STOCK_THRESHOLD = 5;

function totalStock(product: AdminProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

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
  if (stock <= STOCK_THRESHOLD) {
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<StockStatus>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<AdminProduct | null>(null);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allProducts, allCategories] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q),
      );
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    if (stockFilter !== 'all') {
      result = result.filter((p) => {
        const stock = totalStock(p);
        switch (stockFilter) {
          case 'in_stock':
            return stock > 0;
          case 'low_stock':
            return stock > 0 && stock <= STOCK_THRESHOLD;
          case 'out_of_stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    switch (sort) {
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }

    return result;
  }, [products, search, categoryFilter, stockFilter, sort]);

  function openAdd() {
    setEditingProduct(null);
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingProduct(product);
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
    setSuccessMessage(null);
  }

  async function handleSave(form: FormData) {
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      // Import here to avoid circular dependency
      const { createProduct: create, updateProduct: update } = await import(
        '@/lib/admin-products'
      );
      if (editingProduct) {
        await update(editingProduct.id, form);
      } else {
        await create(form);
      }
      setSuccessMessage(
        editingProduct
          ? 'Product updated successfully.'
          : 'Product created successfully.',
      );
      // Keep the modal open briefly so the success toast is visible,
      // then close and refresh the catalogue.
      await new Promise((r) => setTimeout(r, 900));
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      if (archiveTarget.is_active) {
        await archiveProduct(archiveTarget.id);
      } else {
        await unarchiveProduct(archiveTarget.id);
      }
      setArchiveTarget(null);
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to update product status',
      );
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to delete product',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.5em] text-brand-antiqueGoldDark">
            Catalogue
          </p>
          <h1 className="mt-3 font-display text-4xl font-light uppercase tracking-[0.02em] text-brand-espresso sm:text-5xl">
            Products
          </h1>
          <p className="mt-2.5 text-sm text-brand-espresso/55">
            {products.length} piece{products.length !== 1 ? 's' : ''} in the
            collection
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2.5 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight"
        >
          <AdminIcon name="plus" size={16} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-brand-antiqueGold/20 bg-white p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="search"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Search
          </label>
          <div className="relative">
            <AdminIcon
              name="products"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-espresso/35"
            />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, slug or SKU…"
              className="w-full rounded-md border border-brand-espresso/15 bg-white pl-10 pr-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Category
          </label>
          <select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
            <option value="out_of_stock">Out of stock</option>
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name_asc">Name: A – Z</option>
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

      {/* Product table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-brand-antiqueGold/20 bg-white">
        {loading ? (
          <div className="flex items-center justify-center px-6 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-antiqueGold border-t-transparent" />
            <span className="ml-3 text-sm text-brand-espresso/55">
              Loading collection…
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-antiqueGold/25 bg-brand-cream">
              <AdminIcon
                name="products"
                size={28}
                className="text-brand-antiqueGoldDark"
              />
            </div>
            <p className="mt-5 text-sm text-brand-espresso/55">
              {products.length === 0
                ? 'The collection is empty. Add your first piece to begin.'
                : 'No pieces match the current filters.'}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={openAdd}
                className="mt-5 inline-flex items-center gap-2 rounded-md border border-brand-antiqueGold/40 bg-brand-espresso px-6 py-2.5 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight"
              >
                <AdminIcon name="plus" size={15} />
                Add first product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-antiqueGold/15 bg-brand-cream/40">
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Image
                  </th>
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Piece
                  </th>
                  <th className="px-5 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Price
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Stock
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Flags
                  </th>
                  <th className="px-5 py-3.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Created
                  </th>
                  <th className="px-5 py-3.5 text-right text-[0.625rem] font-medium uppercase tracking-[0.2em] text-brand-espresso/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-antiqueGold/10">
                {filtered.map((product) => {
                  const stock = totalStock(product);
                  const primaryImage = product.images[0]?.src ?? '';

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors duration-300 hover:bg-brand-cream/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-brand-antiqueGold/15 bg-brand-cream">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <AdminIcon
                                name="box"
                                size={20}
                                className="text-brand-antiqueGoldDark"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-display text-base font-light uppercase tracking-wide text-brand-espresso">
                          {product.name}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <p className="font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                            {product.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-espresso/70">
                        {product.category?.name ?? 'Uncategorized'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <p className="font-display text-base font-light text-brand-espresso">
                          {formatPrice(product.price)}
                        </p>
                        {product.compare_at_price && (
                          <p className="mt-0.5 text-xs text-brand-espresso/40 line-through">
                            {formatPrice(product.compare_at_price)}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        <span className="font-mono text-sm text-brand-espresso/80">
                          {stock}
                        </span>
                        <div className="mt-1.5 flex justify-center">
                          <StockBadge stock={stock} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {product.is_featured && (
                            <span className="rounded-full border border-brand-antiqueGold/30 bg-brand-antiqueGold/10 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-brand-antiqueGoldDark">
                              Featured
                            </span>
                          )}
                          {product.is_new && (
                            <span className="rounded-full border border-emerald-700/20 bg-emerald-700/[0.07] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.15em] text-emerald-800">
                              New
                            </span>
                          )}
                          {!product.is_featured && !product.is_new && (
                            <span className="text-xs text-brand-espresso/30">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(product)}
                          className={`rounded-full px-3.5 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
                            product.is_active
                              ? 'border border-brand-antiqueGold/30 bg-brand-antiqueGold/10 text-brand-antiqueGoldDark hover:bg-brand-antiqueGold/20'
                              : 'border border-brand-espresso/15 bg-brand-espresso/5 text-brand-espresso/50 hover:bg-brand-espresso/10'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Archived'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-brand-espresso/50">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-md border border-brand-antiqueGold/30 px-3.5 py-2 text-xs font-medium text-brand-espresso/70 transition-colors duration-300 hover:bg-brand-cream hover:text-brand-espresso"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-md border border-brand-burgundy/30 px-3.5 py-2 text-xs font-medium text-brand-burgundy transition-colors duration-300 hover:bg-brand-burgundy/5"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          saving={saving}
          error={formError}
          successMessage={successMessage}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Archive confirmation */}
      {archiveTarget && (
        <ConfirmDialog
          title={
            archiveTarget.is_active
              ? 'Archive this piece?'
              : 'Unarchive this piece?'
          }
          description={
            archiveTarget.is_active
              ? `"${archiveTarget.name}" will be archived and will no longer appear in the storefront. You can restore it at any time.`
              : `"${archiveTarget.name}" will be visible in the storefront again.`
          }
          confirmLabel={archiveTarget.is_active ? 'Archive' : 'Unarchive'}
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this piece permanently?"
          description={`This will permanently remove "${deleteTarget.name}" and all associated images, colours, sizes, variants, details and care instructions. This action cannot be undone.`}
          confirmLabel="Delete permanently"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
