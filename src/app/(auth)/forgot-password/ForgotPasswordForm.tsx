'use client';

/**
 * Forgot password request form.
 */
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const ERROR_MESSAGES: Record<string, string> = {
  'Unable to validate email address: invalid format':
    'Please enter a valid email address.',
  'Too many requests':
    'Too many requests. Please wait a moment and try again.',
};

function friendlyError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-white px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
      });

      if (resetError) {
        setError(friendlyError(resetError.message));
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream px-4 py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-jaali-pattern opacity-70"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-antiqueGold/10 blur-3xl"
        />

        <div className="relative w-full max-w-md text-center">
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.5em] text-brand-antiqueGoldDark">
            House of Avenya
          </p>
          <p className="mt-3 font-display text-4xl font-light uppercase tracking-[0.04em] text-brand-espresso">
            Check your inbox
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <div className="mt-8 rounded-xl border border-brand-antiqueGold/25 bg-white p-8 text-left shadow-[0_24px_60px_-30px_rgba(45,27,21,0.35)]">
            <p className="text-sm leading-relaxed text-brand-espresso/70">
              If an account exists for <strong className="text-brand-espresso">{email}</strong>,
              we&apos;ve sent a password reset link. Please check your inbox and follow the instructions.
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-brand-espresso/55">
            <Link
              href="/login"
              className="font-medium text-brand-antiqueGoldDark underline underline-offset-4 transition-colors hover:text-brand-terracotta"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-jaali-pattern opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-antiqueGold/10 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="text-center">
          <p className="font-sans text-[0.625rem] uppercase tracking-[0.5em] text-brand-antiqueGoldDark">
            House of Avenya
          </p>
          <p className="mt-3 font-display text-4xl font-light uppercase tracking-[0.04em] text-brand-espresso">
            Reset password
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <p className="mt-4 text-sm text-brand-espresso/55">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-brand-antiqueGold/25 bg-white shadow-[0_24px_60px_-30px_rgba(45,27,21,0.35)]">
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8">
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-md border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-4 py-3"
              >
                <svg
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-burgundy"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-brand-burgundy">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="reset-email"
                className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
              >
                Email
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASSES}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-md bg-brand-espresso px-4 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                    />
                  </svg>
                  <span>Sending…</span>
                </>
              ) : (
                <span>Send reset link</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-espresso/55">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-brand-antiqueGoldDark underline underline-offset-4 transition-colors hover:text-brand-terracotta"
          >
            Sign in
          </Link>
        </p>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand-espresso/55 transition-colors hover:text-brand-antiqueGoldDark"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
