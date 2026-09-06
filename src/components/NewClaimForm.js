'use client';

import { useState } from 'react';

const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];
const EMPTY_FORM = { policy_number: '', insured_name: '', loss_date: '', notified_date: '', loss_nature: '', currency: '', estimated_loss: '' };
const inputClass = "bg-white/60 border rounded-lg px-3 py-2 w-full cursor-pointer focus:outline-none transition-colors";
const inputStyle = { borderColor: 'var(--color-line)' };
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";
const labelStyle = { color: 'var(--color-ink-muted)' };

export default function NewClaimForm({ onSuccess, onCancel }) {
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
      if (!form[field]) { setError('All fields are required'); return; }
    }

    const estimatedMinor = Math.round(parseFloat(form.estimated_loss) * 100);
    if (isNaN(estimatedMinor)) { setError('Estimated loss must be a valid number'); return; }

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

    if (!res.ok) { setError(body.error || 'Failed to register claim'); return; }

    setForm(EMPTY_FORM);
    onSuccess(body.id);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass} style={labelStyle}>Policy number</label>
        <input type="text" placeholder="e.g. POL-1001" value={form.policy_number} onChange={(e) => update('policy_number', e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Insured name</label>
        <input type="text" placeholder="e.g. John Doe" value={form.insured_name} onChange={(e) => update('insured_name', e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={labelStyle}>Loss date</label>
          <input type="date" placeholder="mm/dd/yyyy" max={new Date().toISOString().split('T')[0]} value={form.loss_date} onChange={(e) => update('loss_date', e.target.value)} className={inputClass} style={inputStyle} />
          <span className="block text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>Pick a date</span>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Notified date</label>
          <input type="date" placeholder="mm/dd/yyyy" min={form.loss_date || undefined} max={new Date().toISOString().split('T')[0]} value={form.notified_date} onChange={(e) => update('notified_date', e.target.value)} className={inputClass} style={inputStyle} />
          <span className="block text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>Pick a date</span>
        </div>
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Loss nature</label>
        <input type="text" placeholder="e.g. Motor accident" value={form.loss_nature} onChange={(e) => update('loss_nature', e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={labelStyle}>Currency</label>
          <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className={inputClass} style={inputStyle}>
            <option value="">Select...</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Estimated loss</label>
          <input type="number" step="0.01" placeholder="e.g. 5000.00" value={form.estimated_loss} onChange={(e) => update('estimated_loss', e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: 'rgba(180, 67, 47, 0.08)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--color-ink-muted)' }}>Cancel</button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        >
          {saving ? 'Registering...' : 'Register claim'}
        </button>
      </div>
    </form>
  );
}