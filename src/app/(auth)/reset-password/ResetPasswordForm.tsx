'use client';

/**
 * Password reset form — reached from the email link.
 */
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { writeCustomerSessionCookie, clearCustomerSessionCookie } from '@/lib/customer-cookie';

const ERROR_MESSAGES: Record<string, string> = {
  'Password should be at least 6 characters':
    'Password must be at least 6 characters.',
  'Invalid token':
    'This password reset link is invalid or has expired. Please request a new one.',
  'Token has expired':
    'This password reset link has expired. Please request a new one.',
};

function friendlyError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-white px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        writeCustomerSessionCookie(session.access_token, session.expires_at);
      }
    })();
    return () => { active = false; };
  }, []);

  function validate(): boolean {
    if (!password) {
      setError('Please enter a new password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(friendlyError(updateError.message));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 2000);
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
            Password updated
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <p className="mt-8 text-sm text-brand-espresso/70">
            Your password has been reset successfully. Redirecting you to your account…
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
            New password
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />
          <p className="mt-4 text-sm text-brand-espresso/55">
            Choose a strong new password for your account.
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
                  htmlFor="new-password"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className={INPUT_CLASSES}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
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
                  <span>Updating…</span>
                </>
              ) : (
                <span>Update password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
