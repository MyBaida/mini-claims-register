'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

const EMPTY_FORM = {
  policy_number: '',
  insured_name: '',
  loss_date: '',
  notified_date: '',
  loss_nature: '',
  currency: '',
  estimated_loss: '',
};

export default function NewClaimPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const required = ['policy_number', 'insured_name', 'loss_date', 'notified_date', 'loss_nature', 'currency', 'estimated_loss'];
    for (const field of required) {
      if (!form[field]) {
        setError('All fields are required');
        return;
      }
    }

    const estimatedMinor = Math.round(parseFloat(form.estimated_loss) * 100);
    if (isNaN(estimatedMinor)) {
      setError('Estimated loss must be a valid number');
      return;
    }

    setSaving(true);

    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policy_number: form.policy_number,
        insured_name: form.insured_name,
        loss_date: form.loss_date,
        notified_date: form.notified_date,
        loss_nature: form.loss_nature,
        currency: form.currency,
        estimated_loss_minor: estimatedMinor,
      }),
    });

    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(body.error || 'Failed to register claim');
      return;
    }

    router.push(`/claims/${body.id}`);
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Register a claim</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Policy number</label>
          <input
            type="text"
            value={form.policy_number}
            onChange={(e) => update('policy_number', e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Insured name</label>
          <input
            type="text"
            value={form.insured_name}
            onChange={(e) => update('insured_name', e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Loss date</label>
            <input
              type="date"
              value={form.loss_date}
              onChange={(e) => update('loss_date', e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notified date</label>
            <input
              type="date"
              value={form.notified_date}
              onChange={(e) => update('notified_date', e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Loss nature</label>
          <input
            type="text"
            placeholder="e.g. Motor accident"
            value={form.loss_nature}
            onChange={(e) => update('loss_nature', e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => update('currency', e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Select...</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Estimated loss</label>
            <input
              type="number"
              step="0.01"
              value={form.estimated_loss}
              onChange={(e) => update('estimated_loss', e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Registering...' : 'Register claim'}
        </button>
      </form>
    </main>
  );
}