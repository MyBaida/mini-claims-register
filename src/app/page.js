'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import NewClaimForm from '@/components/NewClaimForm';
import { statusDotClass, statusBadgeStyle, statusLabel } from '@/lib/statusStyles';

const STATUSES = ['Reserved, not yet settled', 'Settled, payment outstanding', 'Settled and paid'];
const CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

function formatMinor(minor) {
  if (minor === null || minor === undefined) return '—';
  return (minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ClaimsListPage() {
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ currency: '', status: '', from: '', to: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => setLoading(true));

    const params = new URLSearchParams();
    if (filters.currency) params.set('currency', filters.currency);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    params.set('page', page);
    params.set('pageSize', pageSize);

    fetch(`/api/claims?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims);
        setTotals(data.totals);
        setTotalCount(data.totalCount);
        setLoading(false);
      })
      .catch((err) => { if (err.name !== 'AbortError') console.error(err); });

    return () => controller.abort();
  }, [filters, page]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleClaimCreated(id) {
    setModalOpen(false);
    router.push(`/claims/${id}`);
  }

  function clearFilters() {
    setFilters({ currency: '', status: '', from: '', to: '' });
    setPage(1);
  }

  function today() { return new Date().toISOString().split('T')[0]; }

  function setDatePreset(label) {
    const now = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    if (label === 'This month') {
      setFilters((p) => ({ ...p, from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today() }));
    } else if (label === 'Last 30 days') {
      setFilters((p) => ({ ...p, from: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), to: today() }));
    } else if (label === 'This year') {
      setFilters((p) => ({ ...p, from: fmt(new Date(now.getFullYear(), 0, 1)), to: today() }));
    } else {
      setFilters((p) => ({ ...p, from: '', to: '' }));
    }
    setPage(1);
  }

  const filterInput = "bg-white/60 border rounded-md px-3 py-2 text-sm min-w-0 cursor-pointer focus:outline-none transition-colors";
  const filterStyle = { borderColor: 'var(--color-line)', color: 'var(--color-ink)' };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl tracking-tight" style={{ color: 'var(--color-ink)' }}>Claims Register</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-muted)' }}>Track and manage insurance claims</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm px-5 py-2.5 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        >
          + Register a claim
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/40 rounded-xl border p-4 sm:p-5 mb-6" style={{ borderColor: 'var(--color-line)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            {!loading && (<><span className="font-bold" style={{ color: 'var(--color-accent)' }}>{totalCount}</span> claim{totalCount !== 1 ? 's' : ''} found</>)}
          </span>
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm cursor-pointer hover:underline" style={{ color: 'var(--color-accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            Clear filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block mb-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>From</label>
            <input type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} className={filterInput} style={filterStyle} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>To</label>
            <input type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} className={filterInput} style={filterStyle} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>Status</label>
            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={filterInput} style={filterStyle}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>Currency</label>
            <select value={filters.currency} onChange={(e) => updateFilter('currency', e.target.value)} className={filterInput} style={filterStyle}>
              <option value="">All</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-line)' }}>
          {['This month', 'Last 30 days', 'This year', 'All time'].map((label) => (
            <button key={label} onClick={() => setDatePreset(label)} className="text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors hover:bg-black/[0.03]" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-muted)' }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-pulse rounded-full h-3 w-24 mb-2" style={{ backgroundColor: 'var(--color-line)' }}></div>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>Loading claims...</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 bg-white/30 rounded-xl border" style={{ borderColor: 'var(--color-line)' }}>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--color-ink)' }}>No claims found</p>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>Try adjusting your filters or register a new claim.</p>
        </div>
      ) : (
        <div className="bg-white/50 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-line)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Policy</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Insured</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--color-ink-muted)' }}>Loss date</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Currency</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Approved</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--color-ink-muted)' }}>Paid</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Balance</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-t transition-colors cursor-pointer group" style={{ borderColor: 'var(--color-line)' }}
                    onClick={() => router.push(`/claims/${claim.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold group-hover:underline" style={{ color: 'var(--color-accent)' }}>{claim.policy_number}</span>
                    </td>
                    <td className="py-3 px-4">{claim.insured_name}</td>
                    <td className="py-3 px-4 font-mono-figures hidden sm:table-cell">{claim.loss_date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(15, 146, 103, 0.08)', color: 'var(--color-accent)' }}>{claim.currency}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono-figures">{formatMinor(claim.approved_amount_minor)}</td>
                    <td className="py-3 px-4 text-center font-mono-figures hidden sm:table-cell">{formatMinor(claim.totalPaidMinor)}</td>
                    <td className="py-3 px-4 text-center font-mono-figures font-medium" style={{ color: claim.balanceMinor > 0 ? 'var(--color-status-outstanding)' : 'var(--color-status-paid)' }}>{formatMinor(claim.balanceMinor)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap" style={statusBadgeStyle(claim.status)}>
                          <span className={statusDotClass(claim.status)} style={{ marginRight: 0 }}></span>
                          {statusLabel(claim.status)}
                        </span>
                        <span className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity hidden sm:block" style={{ color: 'var(--color-ink-muted)' }}>→</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination — inside the table card */}
          <div className="border-t px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm" style={{ borderColor: 'var(--color-line)' }}>
            <span style={{ color: 'var(--color-ink-muted)' }}>
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} claim{totalCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-accent)' }}
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <button
                onClick={() => setPage((p) => (p * pageSize < totalCount ? p + 1 : p))}
                disabled={page * pageSize >= totalCount}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-accent)' }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && totals.length > 0 && claims.length > 0 && (
        <div className="mt-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-line)' }}>
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-line)', backgroundColor: 'rgba(15, 146, 103, 0.06)' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>Totals by currency</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-line)' }}>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Currency</th>
                  <th className="py-2.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Approved</th>
                  <th className="py-2.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Paid</th>
                  <th className="py-2.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((t) => (
                  <tr key={t.currency} className="border-t" style={{ borderColor: 'var(--color-line)' }}>
                    <td className="py-2.5 px-4 font-medium">{t.currency}</td>
                    <td className="py-2.5 px-4 text-center font-mono-figures">{formatMinor(t.approvedMinor)}</td>
                    <td className="py-2.5 px-4 text-center font-mono-figures">{formatMinor(t.paidMinor)}</td>
                    <td className="py-2.5 px-4 text-center font-mono-figures font-medium" style={{ color: t.balanceMinor > 0 ? 'var(--color-status-outstanding)' : 'var(--color-status-paid)' }}>{formatMinor(t.balanceMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register a claim">
        <NewClaimForm onSuccess={handleClaimCreated} onCancel={() => setModalOpen(false)} />
      </Modal>
    </main>
  );
}