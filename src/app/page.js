'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUSES = [
  'Reserved, not yet settled',
  'Settled, payment outstanding',
  'Settled and paid',
];
const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

// Amounts are stored as integer minor units (cents/pesewas). This turns them
// back into a readable "1,234.56" for display only.
function formatMinor(minor) {
  if (minor === null || minor === undefined) return '—';
  return (minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ClaimsListPage() {
  const [claims, setClaims] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ currency: '', status: '', from: '', to: '' });

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => setLoading(true));

    const params = new URLSearchParams();
    if (filters.currency) params.set('currency', filters.currency);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    fetch(`/api/claims?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims);
        setTotals(data.totals);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });
      
    return () => controller.abort();
  }, [filters]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Claims Register</h1>
        <Link href="/claims/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Register a claim
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded">
        <div>
          <label className="block text-sm text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Currency</label>
          <select
            value={filters.currency}
            onChange={(e) => updateFilter('currency', e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Policy #</th>
              <th className="p-2">Insured</th>
              <th className="p-2">Loss date</th>
              <th className="p-2">Currency</th>
              <th className="p-2 text-right">Approved</th>
              <th className="p-2 text-right">Paid</th>
              <th className="p-2 text-right">Balance</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <Link href={`/claims/${claim.id}`} className="text-blue-600 hover:underline">
                    {claim.policy_number}
                  </Link>
                </td>
                <td className="p-2">{claim.insured_name}</td>
                <td className="p-2">{claim.loss_date}</td>
                <td className="p-2">{claim.currency}</td>
                <td className="p-2 text-right">{formatMinor(claim.approved_amount_minor)}</td>
                <td className="p-2 text-right">{formatMinor(claim.totalPaidMinor)}</td>
                <td className="p-2 text-right">{formatMinor(claim.balanceMinor)}</td>
                <td className="p-2">{claim.status}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {totals.map((t) => (
              <tr key={t.currency} className="border-t-2 font-semibold bg-gray-50">
                <td className="p-2" colSpan={3}>Total ({t.currency})</td>
                <td className="p-2">{t.currency}</td>
                <td className="p-2 text-right">{formatMinor(t.approvedMinor)}</td>
                <td className="p-2 text-right">{formatMinor(t.paidMinor)}</td>
                <td className="p-2 text-right">{formatMinor(t.balanceMinor)}</td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tfoot>
        </table>
      )}
    </main>
  );
}