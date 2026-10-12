'use client';

import { useMemo, useState } from 'react';
import { useWishlist } from '@/lib/wishlist';
import Link from 'next/link';

type WishlistItem = {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: { src: string }[] | null;
  };
};

type Props = {
  initialItems: WishlistItem[];
};

export default function WishlistClient({ initialItems }: Props) {
  const { ids, isHydrated, isSaved, toggle, remove, clear } = useWishlist();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Build a lookup map from the server-fetched product details.
  const itemMap = useMemo(() => {
    const map = new Map<string, WishlistItem>();
    initialItems.forEach((item) => map.set(item.product_id, item));
    return map;
  }, [initialItems]);

  // Resolve the context's IDs against the server-fetched product data so
  // the display is always driven by the single source of truth (the context).
  const displayedItems = useMemo(() => {
    return ids
      .map((id) => itemMap.get(id))
      .filter((item): item is WishlistItem => item !== undefined);
  }, [ids, itemMap]);

  async function handleRemove(productId: string) {
    try {
      await remove(productId);
      setMessage({ type: 'success', text: 'Removed from wishlist.' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
  }

  async function handleClearAll() {
    if (!confirm('Remove all items from your wishlist?')) return;
    try {
      await clear();
      setMessage({ type: 'success', text: 'Wishlist cleared.' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
        Wishlist
      </h2>
      <p className="mt-1 text-sm text-brand-espresso/55">
        Your saved favourites.
      </p>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`mt-6 flex items-start gap-3 rounded-md border px-4 py-3 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-brand-burgundy/25 bg-brand-burgundy/[0.06] text-brand-burgundy'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {!isHydrated ? (
        <p role="status" className="mt-8 text-sm text-brand-espresso/55">
          Loading your wishlist…
        </p>
      ) : displayedItems.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-brand-espresso/15 p-8 text-center">
          <p className="text-sm text-brand-espresso/55">Your wishlist is empty.</p>
          <p className="mt-2 text-sm">
            <Link
              href="/"
              className="font-medium text-brand-antiqueGoldDark underline underline-offset-4"
            >
              Browse the collection
            </Link>
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => {
              const product = item.products;
              const image = product.product_images?.[0]?.src ?? '/placeholder.jpg';
              const productId = item.product_id;
              return (
                <li
                  key={item.id}
                  className="group rounded-lg border border-brand-espresso/10 bg-brand-cream/30 overflow-hidden"
                >
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-brand-cream">
                      <img
                        src={image}
                        alt={product.name}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-brand-espresso line-clamp-1">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-brand-antiqueGoldDark">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRemove(productId)}
                      className="text-xs text-brand-burgundy underline underline-offset-4 transition-colors hover:text-brand-terracotta"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(productId)}
                      aria-pressed={isSaved(productId)}
                      className={`text-xs underline underline-offset-4 transition-colors ${
                        isSaved(productId)
                          ? 'text-brand-terracotta'
                          : 'text-brand-espresso/50 hover:text-brand-terracotta'
                      }`}
                    >
                      {isSaved(productId) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={handleClearAll}
            className="mt-6 text-xs text-brand-espresso/50 underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors hover:text-brand-terracotta"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}
