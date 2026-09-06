'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { statusDotClass, statusBadgeStyle, statusLabel } from '@/lib/statusStyles';
import Modal from '@/components/Modal';

const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

function formatMinor(minor) {
  if (minor === null || minor === undefined) return '—';
  return (minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

export default function ClaimDetailPage() {
  const { id } = useParams();

  const [claim, setClaim] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [approvedInput, setApprovedInput] = useState('');
  const [approvedSaving, setApprovedSaving] = useState(false);
  const [approvedError, setApprovedError] = useState('');

  const [paymentDate, setPaymentDate] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadClaim = useCallback(() => {
    fetch(`/api/claims/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClaim(data.claim);
        setPayments(data.payments);
        if (data.claim.approved_amount_minor != null) {
          setApprovedInput((data.claim.approved_amount_minor / 100).toString());
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  async function handleSetApproved(e) {
    e.preventDefault();
    setApprovedError('');
    setApprovedSaving(true);

    const minor = Math.round(parseFloat(approvedInput) * 100);
    if (isNaN(minor)) {
      setApprovedError('Enter a valid amount');
      setApprovedSaving(false);
      return;
    }

    const res = await fetch(`/api/claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_amount_minor: minor }),
    });

    setApprovedSaving(false);

    if (!res.ok) {
      const body = await res.json();
      setApprovedError(body.error || 'Failed to save');
      return;
    }

    setApprovedInput('');
    loadClaim();
  }

  async function handleAddPayment(e) {
    e.preventDefault();
    setPaymentError('');
    setPaymentNote('');
    setPaymentSaving(true);

    const amountMinor = Math.round(parseFloat(paymentAmount) * 100);
    if (!paymentDate || !paymentCurrency || isNaN(amountMinor)) {
      setPaymentError('Fill in date, currency and a valid amount');
      setPaymentSaving(false);
      return;
    }

    const res = await fetch(`/api/claims/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_date: paymentDate,
        currency: paymentCurrency,
        amount_minor: amountMinor,
      }),
    });

    const body = await res.json();
    setPaymentSaving(false);

    if (!res.ok) {
      setPaymentError(body.error || 'Failed to save');
      return;
    }

    if (paymentCurrency !== claim.currency) {
      setPaymentNote(
        `Converted at rate ${body.fx_rate} (${body.fx_source}) to ${formatMinor(body.converted_amount_minor)} ${claim.currency}`
      );
    }

    setPaymentDate('');
    setPaymentCurrency('');
    setPaymentAmount('');
    setPaymentModalOpen(false);
    loadClaim();
  }

  if (loading) return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-pulse rounded-full h-3 w-24 mb-2" style={{ backgroundColor: 'var(--color-line)' }}></div>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>Loading claim...</p>
        </div>
      </div>
    </main>
  );
  if (!claim) return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center py-16 bg-white/30 rounded-xl border" style={{ borderColor: 'var(--color-line)' }}>
        <p className="text-base font-medium mb-1" style={{ color: 'var(--color-ink)' }}>Claim not found</p>
        <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>The claim you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    </main>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href="/" className="inline-flex items-center text-sm font-medium hover:underline transition-colors" style={{ color: 'var(--color-accent)' }}>
        <span className="mr-1">&larr;</span> Back to list
      </Link>

      {/* Header */}
      <div className="mt-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-0.5 rounded-full" style={statusBadgeStyle(claim.status)}>
            <span className={statusDotClass(claim.status)} style={{ marginRight: 0 }}></span>
            {statusLabel(claim.status)}
          </span>
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl tracking-tight mb-1">{claim.insured_name}</h1>
        <p className="text-sm font-bold" style={{ color: 'var(--color-ink-muted)' }}>Policy {claim.policy_number}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Claim details */}
        <div className="order-1 lg:col-span-3 bg-white/50 rounded-xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-line)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--color-ink-muted)' }}>Claim details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Loss nature</div>
              <div className="font-medium">{claim.loss_nature}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Loss date</div>
              <div className="font-mono-figures">{formatDate(claim.loss_date)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Notified on</div>
              <div className="font-mono-figures">{formatDate(claim.notified_date)}</div>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="order-2 lg:col-span-2 lg:col-start-4 bg-white/50 rounded-xl border p-5" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--color-ink-muted)' }}>Financial summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Est. loss</div>
                <div className="font-mono-figures text-lg font-medium">{formatMinor(claim.estimated_loss_minor)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Currency</div>
                <div className="font-mono-figures text-lg font-medium">{claim.currency}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Approved</div>
                <div className="font-mono-figures text-lg font-medium">{formatMinor(claim.approved_amount_minor)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>Paid</div>
                <div className="font-mono-figures text-lg" style={{ color: 'var(--color-status-paid)' }}>{formatMinor(claim.totalPaidMinor)}</div>
              </div>
              <div className="col-span-2 rounded-lg p-3 -m-1" style={{ backgroundColor: claim.balanceMinor > 0 ? 'rgba(217, 119, 6, 0.06)' : 'rgba(15, 146, 103, 0.06)' }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: claim.balanceMinor > 0 ? 'var(--color-status-outstanding)' : 'var(--color-status-paid)' }}>Balance</div>
                <div className="font-mono-figures text-lg font-bold" style={{ color: claim.balanceMinor > 0 ? 'var(--color-status-outstanding)' : 'var(--color-status-paid)' }}>{formatMinor(claim.balanceMinor)}</div>
              </div>
            </div>
        </div>

        {/* Set approved amount */}
        <section className="order-3 lg:col-span-2 lg:col-start-4 bg-white/50 rounded-xl border p-5" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--color-ink-muted)' }}>{claim.approved_amount_minor != null ? 'Update approved amount' : 'Set approved amount'}</h2>
            <form onSubmit={handleSetApproved} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>Amount in {claim.currency}</label>
                <input type="number" step="0.01" value={approvedInput} onChange={(e) => setApprovedInput(e.target.value)} className="bg-white/60 border rounded-lg px-3 py-2 text-sm w-full focus:outline-none transition-colors" style={{ borderColor: 'var(--color-line)' }} />
              </div>
              <button
                type="submit"
                disabled={approvedSaving}
                className="text-sm px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: 'var(--color-accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
              >
                {approvedSaving ? 'Saving...' : 'Save'}
              </button>
            </form>
            {approvedError && <p className="text-sm mt-3 font-medium" style={{ color: 'var(--color-error)' }}>{approvedError}</p>}
        </section>

        {/* Payment history */}
        <section className="order-4 lg:col-span-3 lg:row-start-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif-display text-lg">
              Payment history{payments.length > 0 && <span className="ml-1.5 text-sm font-bold" style={{ color: 'var(--color-accent)' }}>({payments.length})</span>}
            </h2>
            <button onClick={() => setPaymentModalOpen(true)} className="text-sm font-bold cursor-pointer hover:underline transition-colors" style={{ color: 'var(--color-accent)' }}>+ Add Payment</button>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-10 bg-white/30 rounded-xl border" style={{ borderColor: 'var(--color-line)' }}>
              <p className="text-base font-medium mb-1" style={{ color: 'var(--color-ink)' }}>No payments yet</p>
              <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>Payments will appear here once recorded.</p>
            </div>
          ) : (
            <div className="bg-white/50 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-line)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Date</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Ccy</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Amount</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Rate</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t transition-colors" style={{ borderColor: 'var(--color-line)' }}>
                        <td className="py-3 px-4 font-mono-figures">{formatDate(p.payment_date)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(15, 146, 103, 0.08)', color: 'var(--color-accent)' }}>{p.currency}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono-figures">{formatMinor(p.amount_minor)}</td>
                        <td className="py-3 px-4 text-center font-mono-figures">{p.fx_rate}</td>
                        <td className="py-3 px-4 text-center font-mono-figures font-medium">{formatMinor(p.converted_amount_minor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {paymentNote && <p className="text-sm font-medium mt-3" style={{ color: 'var(--color-status-outstanding)' }}>{paymentNote}</p>}
        </section>
      </div>

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record a payment">
        <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>Date</label>
            <input type="date" placeholder="mm/dd/yyyy" min={claim.notified_date} max={new Date().toISOString().split('T')[0]} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-white/60 border rounded-lg px-3 py-2 text-sm w-full cursor-pointer focus:outline-none transition-colors" style={{ borderColor: 'var(--color-line)' }} />
            <span className="block text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>Pick a date</span>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>Currency</label>
            <select value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value)} className="bg-white/60 border rounded-lg px-3 py-2 text-sm w-full cursor-pointer focus:outline-none transition-colors" style={{ borderColor: 'var(--color-line)' }}>
              <option value="">Select</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>Amount</label>
            <input type="number" step="0.01" placeholder="e.g. 1500.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="bg-white/60 border rounded-lg px-3 py-2 text-sm w-full cursor-pointer focus:outline-none transition-colors" style={{ borderColor: 'var(--color-line)' }} />
          </div>
          {paymentError && <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{paymentError}</p>}
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--color-ink-muted)' }}>Cancel</button>
            <button
              type="submit"
              disabled={paymentSaving}
              className="text-sm px-5 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 shadow-sm hover:shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
            >
              {paymentSaving ? 'Saving...' : 'Add payment'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}