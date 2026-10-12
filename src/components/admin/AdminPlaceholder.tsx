/**
 * Placeholder for admin sections that are not part of
 * this phase. Clearly marked as upcoming — never renders
 * fake data or pretends a feature exists.
 */
import Link from 'next/link';
import { AdminIcon, type AdminIconName } from './AdminIcon';

export default function AdminPlaceholder({
  name,
  icon,
  description,
  planned,
}: {
  name: string;
  icon: AdminIconName;
  description: string;
  planned: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-xl border border-brand-antiqueGold/25 bg-white px-6 py-14 text-center sm:px-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-jaali-pattern opacity-60"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-antiqueGold/40 bg-brand-antiqueGold/10 px-3.5 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.3em] text-brand-antiqueGoldDark">
            <AdminIcon name="clock" size={12} />
            Coming soon
          </span>

          <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-brand-antiqueGold/30 bg-brand-ivory">
            <AdminIcon name={icon} size={26} className="text-brand-antiqueGoldDark" />
          </div>

          <h2 className="mt-6 font-display text-3xl font-light uppercase tracking-[0.02em] text-brand-espresso">
            {name}
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-brand-espresso/60">
            {description}
          </p>

          <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-left text-sm text-brand-espresso/70">
            {planned.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <AdminIcon
                  name="check"
                  size={15}
                  className="mt-0.5 shrink-0 text-brand-antiqueGoldDark"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs uppercase tracking-[0.25em] text-brand-espresso/40">
            Scheduled for a later phase
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-espresso underline decoration-brand-antiqueGold/60 underline-offset-4 transition-colors hover:text-brand-antiqueGoldDark"
          >
            <AdminIcon name="arrowLeft" size={15} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
