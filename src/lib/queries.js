import db from './db.js';
import * as data from './data.js';

// This is where we pass in the real SQLite database to every data-access function
// so that API routes can call them without passing db explicitly.
// Tests, on the other hand, import from data.js directly and supply their own temporary db.

export function getAllClaims() { return data.getAllClaims(db); }
export function getClaimById(id) { return data.getClaimById(db, id); }
export function getPaymentsForClaim(claimId) { return data.getPaymentsForClaim(db, claimId); }
export function insertClaim(d) { return data.insertClaim(db, d); }
export function updateApprovedAmount(id, amount) { return data.updateApprovedAmount(db, id, amount); }
export function insertPayment(d) { return data.insertPayment(db, d); }
