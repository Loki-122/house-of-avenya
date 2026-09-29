'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import SectionHeading from './SectionHeading';

type Status = 'idle' | 'success' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('success');
    setMessage('Thank you. The next letter from our atelier will find you.');
    setEmail('');
  };

  return (
    <section
      aria-label="Newsletter"
      className="relative overflow-hidden border-y border-brand-antiqueGold/25 bg-brand-warmWhite px-5 py-20 sm:px-8 md:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-jaali-pattern opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-brand-antiqueGold/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <SectionHeading
          label="Join Our World"
          title="The Avenya Letters"
          description="Private previews of new collections, atelier stories, and seasonal notes. Sent with care, never with clutter."
          className="mx-auto max-w-xl"
        />

        <form onSubmit={handleSubmit} noValidate className="mt-10 sm:mt-12">
          <label
            htmlFor="newsletter-email"
            className="mb-3 block text-left font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/60"
          >
            Email Address
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={status === 'error'}
              aria-describedby="newsletter-status"
              className="w-full flex-1 border border-brand-antiqueGold/30 bg-brand-ivory px-5 py-4 text-center font-sans text-editorial-sm tracking-[0.02em] text-brand-espresso transition-colors duration-300 placeholder:text-brand-espresso/35 hover:border-brand-antiqueGold/60 focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta/40 sm:text-left"
            />

            <button
              type="submit"
              className="shrink-0 bg-brand-espresso px-8 py-4 font-sans text-[0.6875rem] uppercase tracking-[0.25em] text-brand-ivory transition-colors duration-300 hover:bg-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Subscribe
            </button>
          </div>

          <p id="newsletter-status" role="status" aria-live="polite" className="mt-4 min-h-5">
            {status === 'success' && (
              <span className="inline-flex animate-fade-in items-center gap-2 font-sans text-[0.8125rem] tracking-[0.02em] text-brand-terracotta">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {message}
              </span>
            )}
            {status === 'error' && (
              <span className="animate-fade-in font-sans text-[0.8125rem] tracking-[0.02em] text-brand-burgundy">
                {message}
              </span>
            )}
          </p>

          <p className="mt-4 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-brand-espresso/45">
            By subscribing you agree to our{' '}
            <Link
              href="/privacy"
              className="underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors hover:text-brand-terracotta"
            >
              Privacy Policy
            </Link>{' '}
            &amp;{' '}
            <Link
              href="/terms"
              className="underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors hover:text-brand-terracotta"
            >
              Terms
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
