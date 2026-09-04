export function statusLabel(status) {
  if (status === 'Reserved, not yet settled') return 'Reserved';
  if (status === 'Settled, payment outstanding') return 'Payment Outstanding';
  return 'Settled & Paid';
}

export function statusDotClass(status) {
  if (status === 'Reserved, not yet settled') return 'status-dot status-dot--reserved';
  if (status === 'Settled, payment outstanding') return 'status-dot status-dot--outstanding';
  return 'status-dot status-dot--paid';
}

export function statusBadgeStyle(status) {
  if (status === 'Reserved, not yet settled') return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-status-reserved)' };
  if (status === 'Settled, payment outstanding') return { backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--color-status-outstanding)' };
  return { backgroundColor: 'rgba(15, 146, 103, 0.1)', color: 'var(--color-status-paid)' };
}