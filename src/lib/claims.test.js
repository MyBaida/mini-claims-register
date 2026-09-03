import { test } from 'node:test';
import assert from 'node:assert';
import {
  totalPaidMinor,
  calculateBalanceMinor,
  deriveStatus,
  convertMinor,
  groupTotalsByCurrency,
  summarizeClaim,
} from './claims.js';

test('totalPaidMinor sums converted amounts', () => {
  const payments = [{ converted_amount_minor: 1000 }, { converted_amount_minor: 500 }];
  assert.strictEqual(totalPaidMinor(payments), 1500);
});

test('totalPaidMinor returns 0 for no payments', () => {
  assert.strictEqual(totalPaidMinor([]), 0);
});

test('calculateBalanceMinor returns null when no approved amount', () => {
  assert.strictEqual(calculateBalanceMinor(null, 500), null);
});

test('calculateBalanceMinor subtracts paid from approved', () => {
  assert.strictEqual(calculateBalanceMinor(5000, 2000), 3000);
});

test('calculateBalanceMinor can go negative on overpayment', () => {
  assert.strictEqual(calculateBalanceMinor(1000, 1500), -500);
});

test('deriveStatus: reserved when approved amount is null', () => {
  assert.strictEqual(deriveStatus(null, null), 'Reserved, not yet settled');
});

test('deriveStatus: outstanding when balance above zero', () => {
  assert.strictEqual(deriveStatus(5000, 3000), 'Settled, payment outstanding');
});

test('deriveStatus: paid when balance is exactly zero', () => {
  assert.strictEqual(deriveStatus(5000, 0), 'Settled and paid');
});

test('deriveStatus: paid when balance is negative (overpaid)', () => {
  assert.strictEqual(deriveStatus(5000, -200), 'Settled and paid');
});

test('convertMinor applies rate and rounds', () => {
  assert.strictEqual(convertMinor(1000, 1.5), 1500);
  assert.strictEqual(convertMinor(333, 0.3), 100); // 99.9 rounds to 100
});

test('summarizeClaim combines paid, balance and status', () => {
  const claim = { id: 1, currency: 'GHS', approved_amount_minor: 5000 };
  const payments = [{ converted_amount_minor: 2000 }];
  const result = summarizeClaim(claim, payments);
  assert.strictEqual(result.totalPaidMinor, 2000);
  assert.strictEqual(result.balanceMinor, 3000);
  assert.strictEqual(result.status, 'Settled, payment outstanding');
});

test('groupTotalsByCurrency keeps currencies separate', () => {
  const claims = [
    { currency: 'GHS', approved_amount_minor: 5000, totalPaidMinor: 2000 },
    { currency: 'GHS', approved_amount_minor: 1000, totalPaidMinor: 1000 },
    { currency: 'USD', approved_amount_minor: 3000, totalPaidMinor: 1000 },
  ];
  const totals = groupTotalsByCurrency(claims);

  const ghs = totals.find(t => t.currency === 'GHS');
  const usd = totals.find(t => t.currency === 'USD');

  assert.strictEqual(ghs.approvedMinor, 6000);
  assert.strictEqual(ghs.paidMinor, 3000);
  assert.strictEqual(ghs.balanceMinor, 3000);

  assert.strictEqual(usd.approvedMinor, 3000);
  assert.strictEqual(usd.paidMinor, 1000);
  assert.strictEqual(usd.balanceMinor, 2000);
});

test('groupTotalsByCurrency treats reserved claims (null approved) as 0 approved', () => {
  const claims = [
    { currency: 'EUR', approved_amount_minor: null, totalPaidMinor: 0 },
  ];
  const totals = groupTotalsByCurrency(claims);
  assert.strictEqual(totals[0].approvedMinor, 0);
  assert.strictEqual(totals[0].balanceMinor, 0);
});