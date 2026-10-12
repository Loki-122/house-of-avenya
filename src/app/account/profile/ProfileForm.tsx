'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { writeCustomerSessionCookie } from '@/lib/customer-cookie';

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

type ProfileFormData = {
  fullName: string;
  phone: string;
};

type Props = {
  initialProfile: { full_name: string | null; phone: string | null };
};

export default function ProfileForm({ initialProfile }: Props) {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: initialProfile.full_name ?? '',
    phone: initialProfile.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim() || null,
          phone: formData.phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
        Profile Information
      </h2>
      <p className="mt-1 text-sm text-brand-espresso/55">
        Update your personal details visible on your account.
      </p>

      {message && (
        <div
          role="status"
          className={`mt-6 flex items-start gap-3 rounded-md border px-4 py-3 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-brand-burgundy/25 bg-brand-burgundy/[0.06] text-brand-burgundy'
          }`}
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {message.type === 'success' ? (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Full name
          </label>
          <input
            id="profile-name"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60"
          >
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
            Email
          </label>
          <p className="text-sm text-brand-espresso/40">Your email cannot be changed here.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
