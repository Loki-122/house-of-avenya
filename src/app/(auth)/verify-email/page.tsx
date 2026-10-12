import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Verify Email — House of Avenya',
  description: 'Verify your email address for your House of Avenya account.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
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
          Verify your email
        </p>
        <div className="mx-auto mt-5 h-px w-16 bg-brand-antiqueGold" />

        <div className="mt-8 rounded-xl border border-brand-antiqueGold/25 bg-white p-8 text-left shadow-[0_24px_60px_-30px_rgba(45,27,21,0.35)]">
          <p className="text-sm leading-relaxed text-brand-espresso/70">
            Thank you for signing up. We&apos;ve sent a verification link to your email address.
            Please click the link in the email to verify your account.
          </p>
          <p className="mt-4 text-sm text-brand-espresso/55">
            Once verified, you can sign in to access your account, view orders, and enjoy a
            personalised experience.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-md bg-brand-espresso px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight"
            >
              Go to sign in
            </Link>
            <Link
              href="/"
              className="text-center text-sm text-brand-espresso/55 underline underline-offset-4 transition-colors hover:text-brand-antiqueGoldDark"
            >
              Return to storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
