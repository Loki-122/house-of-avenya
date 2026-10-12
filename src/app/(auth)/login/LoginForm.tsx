'use client';

/**
 * Customer login form.
 *
 * Email/password authentication against Supabase Auth
 * with the publishable anon key. On success the
 * returned access token is mirrored into the customer
 * session cookie so the server can verify the
 * session.
 */
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { writeCustomerSessionCookie, clearCustomerSessionCookie } from '@/lib/customer-cookie';
import { clearAdminSessionCookie } from '@/lib/admin-cookie';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials':
    'Invalid email or password. Please check your details and try again.',
  'Email not confirmed':
    'Please confirm your email address before signing in.',
  'Too many requests':
    'Too many sign-in attempts. Please wait a moment and try again.',
  'Invalid email or password':
    'Invalid email or password. Please check your details and try again.',
};

function friendlyError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-white px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

export default function LoginForm({
  isAdmin,
  adminEmail,
}: {
  isAdmin: boolean;
  adminEmail: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        writeCustomerSessionCookie(session.access_token, session.expires_at);
        router.refresh();
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        { email, password },
      );

      if (signInError) {
        setError(friendlyError(signInError.message));
        return;
      }

      if (data.session) {
        writeCustomerSessionCookie(
          data.session.access_token,
          data.session.expires_at,
        );
      }

      router.push('/account');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOutAndSwitch() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      clearCustomerSessionCookie();
      clearAdminSessionCookie();
      router.refresh();
    }
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
            Welcome back
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <p className="mt-4 text-sm text-brand-espresso/55">
            Sign in to your account to view orders, manage addresses and more.
          </p>
        </div>

        {/* Admin switch account notice */}
        {isAdmin && (
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 rounded-lg border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-4 py-3.5"
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 shrink-0 h-5 w-5 text-brand-burgundy"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="text-sm leading-relaxed text-brand-burgundy">
              <p className="font-medium">Admin session detected</p>
              <p className="mt-1 text-brand-burgundy/80">
                {adminEmail
                  ? `You are signed in as ${adminEmail} (admin). This account cannot access the customer dashboard.`
                  : 'You are signed in as an admin. This account cannot access the customer dashboard.'}
              </p>
              <button
                type="button"
                onClick={handleSignOutAndSwitch}
                disabled={loading}
                className="mt-3 text-sm font-medium text-brand-antiqueGoldDark underline underline-offset-2 hover:text-brand-antiqueGold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sign out & switch account
              </button>
            </div>
          </div>
        )}

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
                  htmlFor="customer-email"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Email
                </label>
                <input
                  id="customer-email"
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

              <div>
                <label
                  htmlFor="customer-password"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Password
                </label>
                <input
                  id="customer-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className={INPUT_CLASSES}
                />
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
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-espresso/55">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-brand-antiqueGoldDark underline underline-offset-4 transition-colors hover:text-brand-terracotta"
          >
            Create one
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-brand-espresso/55">
          <Link
            href="/forgot-password"
            className="font-medium text-brand-antiqueGoldDark underline underline-offset-4 transition-colors hover:text-brand-terracotta"
          >
            Forgot your password?
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
