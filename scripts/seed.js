import db from '../src/lib/db.js';
import { fallbackRate as rateFromTo } from '../src/lib/fx.js';


// Sample claims data for seeding the database.
const claims = [
  { policy_number: 'POL-1001', insured_name: 'Kwame Mensah', loss_date: '2026-03-01', notified_date: '2026-03-03', loss_nature: 'Motor accident', currency: 'GHS', estimated_loss_minor: 500000, approved_amount_minor: null, payments: [] },
  { policy_number: 'POL-1002', insured_name: 'Ama Boateng', loss_date: '2026-02-15', notified_date: '2026-02-17', loss_nature: 'Fire damage', currency: 'USD', estimated_loss_minor: 1200000, approved_amount_minor: null, payments: [] },
  { policy_number: 'POL-1003', insured_name: 'John Owusu', loss_date: '2026-01-10', notified_date: '2026-01-12', loss_nature: 'Theft', currency: 'GHS', estimated_loss_minor: 300000, approved_amount_minor: 250000, payments: [{ payment_date: '2026-01-20', currency: 'GHS', amount_minor: 100000 }] },
  { policy_number: 'POL-1004', insured_name: 'Grace Addo', loss_date: '2026-01-05', notified_date: '2026-01-06', loss_nature: 'Water damage', currency: 'USD', estimated_loss_minor: 400000, approved_amount_minor: 350000, payments: [{ payment_date: '2026-01-15', currency: 'USD', amount_minor: 350000 }] },
  { policy_number: 'POL-1005', insured_name: 'Michael Osei', loss_date: '2026-04-01', notified_date: '2026-04-02', loss_nature: 'Burglary', currency: 'GBP', estimated_loss_minor: 200000, approved_amount_minor: 150000, payments: [{ payment_date: '2026-04-10', currency: 'GBP', amount_minor: 160000 }] },
  { policy_number: 'POL-1006', insured_name: 'Efua Asante', loss_date: '2026-03-20', notified_date: '2026-03-22', loss_nature: 'Storm damage', currency: 'EUR', estimated_loss_minor: 450000, approved_amount_minor: 400000, payments: [] },
  { policy_number: 'POL-1007', insured_name: 'Kojo Appiah', loss_date: '2026-02-01', notified_date: '2026-02-03', loss_nature: 'Motor accident', currency: 'GHS', estimated_loss_minor: 1000000, approved_amount_minor: 1000000, payments: [{ payment_date: '2026-02-10', currency: 'GHS', amount_minor: 600000 }, { payment_date: '2026-02-25', currency: 'GHS', amount_minor: 400000 }] },
  { policy_number: 'POL-1008', insured_name: 'Linda Darko', loss_date: '2026-01-25', notified_date: '2026-01-27', loss_nature: 'Marine cargo loss', currency: 'USD', estimated_loss_minor: 300000, approved_amount_minor: 250000, payments: [{ payment_date: '2026-02-01', currency: 'USD', amount_minor: 100000 }, { payment_date: '2026-02-15', currency: 'USD', amount_minor: 50000 }] },
  { policy_number: 'POL-1009', insured_name: 'Samuel Tetteh', loss_date: '2026-03-05', notified_date: '2026-03-07', loss_nature: 'Public liability', currency: 'GBP', estimated_loss_minor: 500000, approved_amount_minor: null, payments: [] },
  { policy_number: 'POL-1010', insured_name: 'Abena Frimpong', loss_date: '2026-02-20', notified_date: '2026-02-21', loss_nature: 'Fire damage', currency: 'EUR', estimated_loss_minor: 600000, approved_amount_minor: 600000, payments: [{ payment_date: '2026-03-01', currency: 'EUR', amount_minor: 600000 }] },
  // Off-currency payment example: claim reserved in GHS but paid in USD.
  { policy_number: 'POL-1011', insured_name: 'Yaw Adjei', loss_date: '2026-04-10', notified_date: '2026-04-12', loss_nature: 'Motor accident', currency: 'GHS', estimated_loss_minor: 800000, approved_amount_minor: 800000, payments: [{ payment_date: '2026-04-20', currency: 'USD', amount_minor: 20000 }] },
  { policy_number: 'POL-1012', insured_name: 'Comfort Nyarko', loss_date: '2026-01-15', notified_date: '2026-01-16', loss_nature: 'Theft', currency: 'USD', estimated_loss_minor: 500000, approved_amount_minor: 500000, payments: [] },
  // Reserved claim that already has an advance payment. Status still depends on approved_amount.
  { policy_number: 'POL-1013', insured_name: 'Isaac Boadi', loss_date: '2026-03-15', notified_date: '2026-03-18', loss_nature: 'Water damage', currency: 'GHS', estimated_loss_minor: 200000, approved_amount_minor: null, payments: [{ payment_date: '2026-03-25', currency: 'GHS', amount_minor: 50000 }] },
  { policy_number: 'POL-1014', insured_name: 'Patricia Ansah', loss_date: '2026-02-05', notified_date: '2026-02-06', loss_nature: 'Burglary', currency: 'GBP', estimated_loss_minor: 250000, approved_amount_minor: 200000, payments: [{ payment_date: '2026-02-20', currency: 'GBP', amount_minor: 250000 }] },
  { policy_number: 'POL-1015', insured_name: 'Daniel Kwarteng', loss_date: '2026-01-30', notified_date: '2026-02-01', loss_nature: 'Storm damage', currency: 'EUR', estimated_loss_minor: 400000, approved_amount_minor: 350000, payments: [{ payment_date: '2026-02-10', currency: 'EUR', amount_minor: 100000 }] },
  { policy_number: 'POL-1016', insured_name: 'Vivian Sarpong', loss_date: '2026-04-05', notified_date: '2026-04-06', loss_nature: 'Marine cargo loss', currency: 'USD', estimated_loss_minor: 700000, approved_amount_minor: null, payments: [] },
];

function seed() {

  // Reset the db so this script is safe to re-run.
  db.exec('DELETE FROM payments; DELETE FROM claims; DELETE FROM sqlite_sequence WHERE name IN (\'claims\', \'payments\');');
  
  // Prepare reusable statements for inserting claims and payments. 
  const insertClaim = db.prepare(`
    INSERT INTO claims (policy_number, insured_name, loss_date, notified_date, loss_nature, currency, estimated_loss_minor, approved_amount_minor)
    VALUES (@policy_number, @insured_name, @loss_date, @notified_date, @loss_nature, @currency, @estimated_loss_minor, @approved_amount_minor)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (claim_id, payment_date, currency, amount_minor, fx_rate, converted_amount_minor)
    VALUES (@claim_id, @payment_date, @currency, @amount_minor, @fx_rate, @converted_amount_minor)
  `);

  for (const claim of claims) {
    const result = insertClaim.run({
      policy_number: claim.policy_number,
      insured_name: claim.insured_name,
      loss_date: claim.loss_date,
      notified_date: claim.notified_date,
      loss_nature: claim.loss_nature,
      currency: claim.currency,
      estimated_loss_minor: claim.estimated_loss_minor,
      approved_amount_minor: claim.approved_amount_minor,
    });

    const claimId = result.lastInsertRowid;

    for (const payment of claim.payments) {

      // we always convert the payment to the claim's currency using the fixed FX rates from the fallback rates..
      const rate = rateFromTo(payment.currency, claim.currency);
      const converted = Math.round(payment.amount_minor * rate);

      insertPayment.run({
        claim_id: claimId,
        payment_date: payment.payment_date,
        currency: payment.currency,
        amount_minor: payment.amount_minor,
        fx_rate: rate,
        converted_amount_minor: converted,
      });
    }
  }

  console.log(`Seeded ${claims.length} claims.`);
}

seed();