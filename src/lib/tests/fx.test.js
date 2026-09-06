import { test } from 'node:test';
import assert from 'node:assert';
import { fallbackRate, getExchangeRate } from '../fx.js';

// fallbackRate

test('fallbackRate returns 1 for same currency', () => {
  assert.strictEqual(fallbackRate('GHS', 'GHS'), 1);
  assert.strictEqual(fallbackRate('USD', 'USD'), 1);
  assert.strictEqual(fallbackRate('EUR', 'EUR'), 1);
});

test('fallbackRate converts via USD pivot (GHS → USD)', () => {
  // 1 GHS = (1/12) USD ≈ 0.0833
  const rate = fallbackRate('GHS', 'USD');
  assert.ok(Math.abs(rate - 1 / 12) < 1e-10);
});

test('fallbackRate converts via USD pivot (USD → GHS)', () => {
  // 1 USD = 12 GHS
  const rate = fallbackRate('USD', 'GHS');
  assert.strictEqual(rate, 12);
});

test('fallbackRate cross-rate (GBP → EUR)', () => {
  // GBP → EUR = (0.92 / 0.79) ≈ 1.1646
  const rate = fallbackRate('GBP', 'EUR');
  assert.ok(Math.abs(rate - 0.92 / 0.79) < 1e-10);
});

test('fallbackRate cross-rate (EUR → GBP)', () => {
  // EUR → GBP = (0.79 / 0.92) ≈ 0.8587
  const rate = fallbackRate('EUR', 'GBP');
  assert.ok(Math.abs(rate - 0.79 / 0.92) < 1e-10);
});

test('fallbackRate is consistent in both directions', () => {
  const aToB = fallbackRate('GHS', 'EUR');
  const bToA = fallbackRate('EUR', 'GHS');
  // Multiplying both directions should give ~1
  assert.ok(Math.abs(aToB * bToA - 1) < 1e-10);
});

// getExchangeRate 

test('getExchangeRate returns rate 1 for same currency', async () => {
  const result = await getExchangeRate('USD', 'USD');
  assert.strictEqual(result.rate, 1);
  assert.strictEqual(result.source, 'same-currency');
});

test('getExchangeRate returns a rate and source for live API (GHS → USD)', async () => {
  const result = await getExchangeRate('GHS', 'USD');
  assert.strictEqual(typeof result.rate, 'number');
  assert.ok(result.rate > 0);
  assert.ok(['live', 'fallback'].includes(result.source));
});
