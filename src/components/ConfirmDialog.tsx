'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  busyLabel = 'Removing…',
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-brand-espresso/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-brand-antiqueGold/25 bg-brand-ivory p-8 shadow-2xl animate-scale-in">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-brand-antiqueGold/30 bg-brand-cream">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={danger ? 'text-brand-burgundy' : 'text-brand-antiqueGoldDark'}
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 className="text-center font-display text-xl font-light uppercase tracking-wide text-brand-espresso">
          {title}
        </h3>

        {description && (
          <p className="mt-3 text-center text-sm leading-relaxed text-brand-espresso/60">
            {description}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-brand-antiqueGold/30 px-5 py-2.5 text-sm font-medium text-brand-espresso/70 transition-colors duration-300 hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? 'border border-brand-burgundy/40 bg-brand-burgundy text-brand-ivory hover:bg-brand-burgundy/90'
                : 'border border-brand-antiqueGold/40 bg-brand-espresso text-brand-ivory hover:bg-brand-espressoLight'
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
