'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

function formatMinor(minor) {
  if (minor === null || minor === undefined) return '—';
  return (minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const loadClaim = useCallback(() => {
    fetch(`/api/claims/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClaim(data.claim);
        setPayments(data.payments);
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
    loadClaim();
  }

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading...</main>;
  if (!claim) return <main className="max-w-3xl mx-auto p-6">Claim not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-600 hover:underline text-sm">&larr; Back to list</Link>

      <h1 className="text-2xl font-semibold mt-2 mb-1">{claim.policy_number} — {claim.insured_name}</h1>
      <p className="text-gray-600 mb-6">{claim.loss_nature} · Loss date {claim.loss_date} · Notified {claim.notified_date}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded">
        <div>
          <div className="text-sm text-gray-500">Currency</div>
          <div className="font-semibold">{claim.currency}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Approved</div>
          <div className="font-semibold">{formatMinor(claim.approved_amount_minor)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Paid</div>
          <div className="font-semibold">{formatMinor(claim.totalPaidMinor)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Balance</div>
          <div className="font-semibold">{formatMinor(claim.balanceMinor)}</div>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <div className="text-sm text-gray-500">Status</div>
          <div className="font-semibold">{claim.status}</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Set / update approved amount</h2>
        <form onSubmit={handleSetApproved} className="flex gap-2 items-start">
          <input
            type="number"
            step="0.01"
            placeholder={`Amount in ${claim.currency}`}
            value={approvedInput}
            onChange={(e) => setApprovedInput(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <button
            type="submit"
            disabled={approvedSaving}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {approvedSaving ? 'Saving...' : 'Save'}
          </button>
        </form>
        {approvedError && <p className="text-red-600 text-sm mt-1">{approvedError}</p>}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Record a payment</h2>
        <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start">
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <select
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Currency</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            type="submit"
            disabled={paymentSaving}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {paymentSaving ? 'Saving...' : 'Add payment'}
          </button>
        </form>
        {paymentError && <p className="text-red-600 text-sm mt-1">{paymentError}</p>}
        {paymentNote && <p className="text-green-700 text-sm mt-1">{paymentNote}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm">No payments recorded yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Currency</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Converted ({claim.currency})</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.payment_date}</td>
                  <td className="p-2">{p.currency}</td>
                  <td className="p-2 text-right">{formatMinor(p.amount_minor)}</td>
                  <td className="p-2 text-right">{p.fx_rate}</td>
                  <td className="p-2 text-right">{formatMinor(p.converted_amount_minor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}