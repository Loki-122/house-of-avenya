'use client';

/**
 * Customer registration form.
 */
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { writeCustomerSessionCookie } from '@/lib/customer-cookie';

const ERROR_MESSAGES: Record<string, string> = {
  'User already registered':
    'An account with this email already exists. Please sign in instead.',
  'Password should be at least 6 characters':
    'Password must be at least 6 characters.',
  'Unable to validate email address: invalid format':
    'Please enter a valid email address.',
  'Signup is disabled':
    'New registrations are temporarily disabled. Please try again later.',
};

function friendlyError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-white px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

export default function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/verify-email`,
        },
      });

      if (signUpError) {
        setError(friendlyError(signUpError.message));
        return;
      }

      if (data.session) {
        writeCustomerSessionCookie(data.session.access_token, data.session.expires_at);
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
              We&apos;ve sent a verification link to <strong className="text-brand-espresso">{email}</strong>.
              Please check your inbox and click the link to activate your account before signing in.
            </p>
            <p className="mt-4 text-sm text-brand-espresso/55">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="font-medium text-brand-antiqueGoldDark underline underline-offset-4"
              >
                try again
              </button>
              .
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
            Create account
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <p className="mt-4 text-sm text-brand-espresso/55">
            Join us for a curated experience of timeless Indian fashion.
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

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Full name
                </label>
                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Priya Sharma"
                  className={INPUT_CLASSES}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1.5 text-xs text-brand-burgundy">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASSES}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-brand-burgundy">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className={INPUT_CLASSES}
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-brand-burgundy">{fieldErrors.password}</p>
                )}
              </div>
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
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-espresso/55">
          Already have an account?{' '}
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
