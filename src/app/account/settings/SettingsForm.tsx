'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { clearCustomerSessionCookie } from '@/lib/customer-cookie';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

export default function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const router = useRouter();

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
        return;
      }
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      setDeleteMessage('Please type DELETE to confirm.');
      return;
    }
    setDeleteSaving(true);
    setDeleteMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to delete account.');
      }

      await supabase.auth.signOut();
      setDeleteMessage('Your account has been deleted.');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
          Change Password
        </h2>
        <p className="mt-1 text-sm text-brand-espresso/55">
          Update your account password.
        </p>

        {passwordMessage && (
          <div
            role="status"
            className={`mt-6 flex items-start gap-3 rounded-md border px-4 py-3 ${
              passwordMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-brand-burgundy/25 bg-brand-burgundy/[0.06] text-brand-burgundy'
            }`}
          >
            <p className="text-sm">{passwordMessage.text}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="mt-6 space-y-5 max-w-md">
          <PasswordInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            label="New password"
            className={INPUT_CLASSES}
          />
          <PasswordInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            label="Confirm new password"
            className={INPUT_CLASSES}
          />
          <button
            type="submit"
            disabled={passwordSaving}
            className="flex items-center justify-center gap-2 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="border-t border-brand-espresso/10 pt-8">
        <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-burgundy">
          Delete Account
        </h2>
        <p className="mt-1 text-sm text-brand-espresso/55">
          Once deleted, your account and all associated data cannot be recovered.
        </p>

        {deleteMessage && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-md border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-4 py-3"
          >
            <p className="text-sm text-brand-burgundy">{deleteMessage}</p>
          </div>
        )}

        <div className="mt-6 max-w-md">
          <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className={INPUT_CLASSES}
          />
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteSaving}
            className="mt-4 flex items-center justify-center gap-2 rounded-md border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-burgundy transition-colors duration-300 hover:bg-brand-burgundy hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteSaving ? 'Deleting…' : 'Delete account permanently'}
          </button>
        </div>
      </section>
    </div>
  );
}
