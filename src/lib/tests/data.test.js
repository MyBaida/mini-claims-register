import { test, before, after } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  getAllClaims,
  getClaimById,
  getPaymentsForClaim,
  insertClaim,
  updateApprovedAmount,
  insertPayment,
} from '../data.js';

let db;

before(() => {
  // Create an in-memory SQLite database for testing
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // Load the schema
  const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
});

after(() => {
  db.close();
});

// insertClaim

test('insertClaim creates a new claim and returns its id', () => {
  const id = insertClaim(db, {
    policy_number: 'POL-TEST-001',
    insured_name: 'Test User',
    loss_date: '2026-01-15',
    notified_date: '2026-01-16',
    loss_nature: 'Fire damage',
    currency: 'GHS',
    estimated_loss_minor: 500000,
    approved_amount_minor: null,
  });

  assert.ok(typeof id === 'number' || typeof id === 'bigint');
  assert.ok(Number(id) > 0);
});

test('insertClaim defaults approved_amount_minor to null when omitted', () => {
  const id = insertClaim(db, {
    policy_number: 'POL-TEST-002',
    insured_name: 'Test User 2',
    loss_date: '2026-02-01',
    notified_date: '2026-02-02',
    loss_nature: 'Theft',
    currency: 'USD',
    estimated_loss_minor: 100000,
  });

  const claim = getClaimById(db, Number(id));
  assert.strictEqual(claim.approved_amount_minor, null);
});

// getClaimById 

test('getClaimById returns the correct claim', () => {
  const claim = getClaimById(db, 1);
  assert.strictEqual(claim.policy_number, 'POL-TEST-001');
  assert.strictEqual(claim.insured_name, 'Test User');
  assert.strictEqual(claim.currency, 'GHS');
  assert.strictEqual(claim.estimated_loss_minor, 500000);
});

test('getClaimById returns undefined for non-existent id', () => {
  const claim = getClaimById(db, 9999);
  assert.strictEqual(claim, undefined);
});

// getAllClaims 

test('getAllClaims returns all claims ordered by loss_date DESC', () => {
  const claims = getAllClaims(db);
  assert.ok(claims.length >= 2);
  // Verify ordering: most recent loss_date first
  for (let i = 1; i < claims.length; i++) {
    assert.ok(claims[i - 1].loss_date >= claims[i].loss_date);
  }
});

// updateApprovedAmount 

test('updateApprovedAmount sets the approved amount', () => {
  updateApprovedAmount(db, 1, 400000);
  const claim = getClaimById(db, 1);
  assert.strictEqual(claim.approved_amount_minor, 400000);
});

test('updateApprovedAmount can update to a different value', () => {
  updateApprovedAmount(db, 1, 350000);
  const claim = getClaimById(db, 1);
  assert.strictEqual(claim.approved_amount_minor, 350000);
});

test('updateApprovedAmount can set to null (reset to reserved)', () => {
  updateApprovedAmount(db, 1, null);
  const claim = getClaimById(db, 1);
  assert.strictEqual(claim.approved_amount_minor, null);
});

// insertPayment 

test('insertPayment creates a payment and returns its id', () => {
  const id = insertPayment(db, {
    claim_id: 1,
    payment_date: '2026-03-01',
    currency: 'GHS',
    amount_minor: 100000,
    fx_rate: 1,
    converted_amount_minor: 100000,
  });

  assert.ok(typeof id === 'number' || typeof id === 'bigint');
  assert.ok(Number(id) > 0);
});

test('insertPayment supports FX conversion (different currency)', () => {
  const id = insertPayment(db, {
    claim_id: 1,
    payment_date: '2026-03-15',
    currency: 'USD',
    amount_minor: 5000,
    fx_rate: 12,
    converted_amount_minor: 60000,
  });

  const payments = getPaymentsForClaim(db, 1);
  const usdPayment = payments.find(p => Number(p.id) === Number(id));
  assert.strictEqual(usdPayment.currency, 'USD');
  assert.strictEqual(usdPayment.amount_minor, 5000);
  assert.strictEqual(usdPayment.fx_rate, 12);
  assert.strictEqual(usdPayment.converted_amount_minor, 60000);
});

// getPaymentsForClaim 

test('getPaymentsForClaim returns payments ordered by payment_date ASC', () => {
  const payments = getPaymentsForClaim(db, 1);
  assert.ok(payments.length >= 2);
  // Verify ordering
  for (let i = 1; i < payments.length; i++) {
    assert.ok(payments[i - 1].payment_date <= payments[i].payment_date);
  }
});

test('getPaymentsForClaim returns empty array for claim with no payments', () => {
  const payments = getPaymentsForClaim(db, 2);
  assert.ok(Array.isArray(payments));
  assert.strictEqual(payments.length, 0);
});

// Multiple payments per claim 

test('a claim can have multiple payments in different currencies', () => {
  // Insert a third claim
  const claimId = insertClaim(db, {
    policy_number: 'POL-TEST-003',
    insured_name: 'Test User 3',
    loss_date: '2026-04-01',
    notified_date: '2026-04-02',
    loss_nature: 'Water damage',
    currency: 'EUR',
    estimated_loss_minor: 200000,
    approved_amount_minor: 180000,
  });

  // Add two payments in different currencies
  insertPayment(db, {
    claim_id: Number(claimId),
    payment_date: '2026-05-01',
    currency: 'EUR',
    amount_minor: 50000,
    fx_rate: 1,
    converted_amount_minor: 50000,
  });
  insertPayment(db, {
    claim_id: Number(claimId),
    payment_date: '2026-05-15',
    currency: 'GBP',
    amount_minor: 10000,
    fx_rate: 1.16,
    converted_amount_minor: 11600,
  });

  const payments = getPaymentsForClaim(db, Number(claimId));
  assert.strictEqual(payments.length, 2);
  assert.strictEqual(payments[0].currency, 'EUR');
  assert.strictEqual(payments[1].currency, 'GBP');
});
