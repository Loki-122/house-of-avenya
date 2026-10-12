'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';

const INPUT_CLASSES =
  'w-full rounded-md border border-brand-espresso/15 bg-brand-ivory px-4 py-3 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25';

type Address = {
  id: string;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

type AddressFormData = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
};

const emptyForm: AddressFormData = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  phone: '',
};

type Props = {
  initialAddresses: Address[];
};

export default function AddressesClient({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  function startEdit(address: Address) {
    setFormData({
      name: address.name,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone ?? '',
    });
    setIsEditing(address.id);
    setMessage(null);
  }

  function startAdd() {
    setFormData(emptyForm);
    setIsEditing('new');
    setMessage(null);
  }

  function cancelEdit() {
    setIsEditing(null);
    setFormData(emptyForm);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isEditing === 'new') {
        const { error } = await supabase.from('addresses').insert({
          user_id: user.id,
          name: formData.name,
          line1: formData.line1,
          line2: formData.line2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone || null,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Address added.' });
      } else {
        const { error } = await supabase
          .from('addresses')
          .update({
            name: formData.name,
            line1: formData.line1,
            line2: formData.line2 || null,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            phone: formData.phone || null,
          })
          .eq('id', isEditing)
          .eq('user_id', user.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Address updated.' });
      }

      const { data: refreshed } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (refreshed) setAddresses(refreshed);
      setIsEditing(null);
      setFormData(emptyForm);
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    setDeletingAddress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('addresses').delete().eq('id', idToDelete).eq('user_id', user.id);
      if (error) throw error;

      const { data: refreshed } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (refreshed) setAddresses(refreshed);
      else setAddresses(addresses.filter((a) => a.id !== idToDelete));

      if (isEditing === idToDelete) cancelEdit();
      setPendingDeleteId(null);
      setMessage({ type: 'success', text: 'Address removed.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete address.' });
    } finally {
      setDeletingAddress(false);
    }
  }

  const pendingDeleteAddress = addresses.find((a) => a.id === pendingDeleteId) || null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-light uppercase tracking-[0.08em] text-brand-espresso">
            Addresses
          </h2>
          <p className="mt-1 text-sm text-brand-espresso/55">
            Manage your delivery addresses.
          </p>
        </div>
        {isEditing !== 'new' && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-md border border-brand-espresso/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-espresso transition-colors hover:border-brand-antiqueGold hover:text-brand-antiqueGoldDark"
          >
            Add new
          </button>
        )}
      </div>

      {message && (
        <div
          role="status"
          className={`mt-6 flex items-start gap-3 rounded-md border px-4 py-3 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-brand-burgundy/25 bg-brand-burgundy/[0.06] text-brand-burgundy'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-brand-espresso/10 bg-brand-cream/30 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Full name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={INPUT_CLASSES}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={INPUT_CLASSES}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Address line 1</label>
            <input
              type="text"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              className={INPUT_CLASSES}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Address line 2</label>
            <input
              type="text"
              value={formData.line2}
              onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
              className={INPUT_CLASSES}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={INPUT_CLASSES}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={INPUT_CLASSES}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Postal code</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className={INPUT_CLASSES}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className={INPUT_CLASSES}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-md bg-brand-espresso px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEditing === 'new' ? 'Add address' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-brand-espresso/15 px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-espresso/60 transition-colors hover:border-brand-espresso/30"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !isEditing ? (
        <p className="mt-6 text-sm text-brand-espresso/55">You have no saved addresses.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <li key={addr.id} className="rounded-lg border border-brand-espresso/10 bg-brand-cream/30 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-espresso">{addr.name}</p>
                  <p className="mt-1 text-sm text-brand-espresso/60">
                    {addr.line1}
                    {addr.line2 && <>, {addr.line2}</>}
                  </p>
                  <p className="text-sm text-brand-espresso/60">
                    {addr.city}, {addr.state} {addr.postal_code}
                  </p>
                  <p className="text-sm text-brand-espresso/60">{addr.country}</p>
                  {addr.phone && <p className="text-sm text-brand-espresso/60">{addr.phone}</p>}
                </div>
                {isEditing !== addr.id && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(addr)}
                      className="text-xs text-brand-antiqueGoldDark underline underline-offset-4"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(addr.id)}
                      className="text-xs text-brand-burgundy underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove this address?"
        description={
          pendingDeleteAddress
            ? `${pendingDeleteAddress.name}, ${pendingDeleteAddress.city} will be permanently removed from your saved addresses. This action cannot be undone.`
            : 'This address will be permanently removed from your saved addresses. This action cannot be undone.'
        }
        confirmLabel="Remove"
        danger
        busy={deletingAddress}
        busyLabel="Removing…"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deletingAddress) setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
