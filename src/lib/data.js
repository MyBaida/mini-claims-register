import db from './db.js';

export function getAllClaims() {
  return db.prepare('SELECT * FROM claims ORDER BY loss_date DESC').all();
}

export function getClaimById(id) {
  return db.prepare('SELECT * FROM claims WHERE id = ?').get(id);
}

export function getPaymentsForClaim(claimId) {
  return db.prepare('SELECT * FROM payments WHERE claim_id = ? ORDER BY payment_date ASC').all(claimId);
}

export function insertClaim(data) {
  const stmt = db.prepare(`
    INSERT INTO claims (policy_number, insured_name, loss_date, notified_date, loss_nature, currency, estimated_loss_minor, approved_amount_minor)
    VALUES (@policy_number, @insured_name, @loss_date, @notified_date, @loss_nature, @currency, @estimated_loss_minor, @approved_amount_minor)
  `);
  const result = stmt.run({ ...data, approved_amount_minor: data.approved_amount_minor ?? null });
  return result.lastInsertRowid;
}

export function updateApprovedAmount(id, approvedAmountMinor) {
  db.prepare('UPDATE claims SET approved_amount_minor = ? WHERE id = ?').run(approvedAmountMinor, id);
}