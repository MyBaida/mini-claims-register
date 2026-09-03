// just calculation functions here, so that we can test the money maths in isolation

/*
  Sums the converted amounts of a list of payments.
  Each payment's converted_amount_minor is already expressed
  in the claim's own currency (converted at the time it was entered).
 */
export function totalPaidMinor(payments) {
  return payments.reduce((sum, payment) => sum + payment.converted_amount_minor, 0);
}

/*
  "Approved less paid." Returns null if no approved amount has been set yet
  since there is no balance to speak of until someone approves a figure.
 */
export function calculateBalanceMinor(approvedAmountMinor, totalPaid) {
  if (approvedAmountMinor === null || approvedAmountMinor === undefined) {
    return null;
  }
  return approvedAmountMinor - totalPaid;
}

/*
  The three statuses are derived and never stored.
 */
export function deriveStatus(approvedAmountMinor, balanceMinor) {
  if (approvedAmountMinor === null || approvedAmountMinor === undefined) {
    return 'Reserved, not yet settled';
  }
  if (balanceMinor > 0) {
    return 'Settled, payment outstanding';
  }
  return 'Settled and paid';
}

/*
  given a claim and its payments, return everything
  derived about it in one go. 
 */
export function summarizeClaim(claim, payments) {
  const totalPaid = totalPaidMinor(payments);
  const balance = calculateBalanceMinor(claim.approved_amount_minor, totalPaid);
  const status = deriveStatus(claim.approved_amount_minor, balance);
  return { ...claim, totalPaidMinor: totalPaid, balanceMinor: balance, status };
}

/*
  Converts an amount from a payment's own currency into the claim's currency,
  using a given rate. Rounded because we only ever store whole minor units.
 */
export function convertMinor(amountMinor, rate) {
  return Math.round(amountMinor * rate);
}

/*
  Groups a list of summarized claims into per-currency totals.
  Never adds two different currencies together.
  Balance total is derived from the summed approved/paid totals,
  rather than summing each claim's individual balance, so that
  reserved claims (has balance = null) can't corrupt the sum.
 */
export function groupTotalsByCurrency(summarizedClaims) {
  const totals = {};

  for (const claim of summarizedClaims) {
    const currency = claim.currency;
    if (!totals[currency]) {
      totals[currency] = { currency, approvedMinor: 0, paidMinor: 0, balanceMinor: 0 };
    }
    totals[currency].approvedMinor += claim.approved_amount_minor ?? 0;
    totals[currency].paidMinor += claim.totalPaidMinor;
  }

  for (const currency in totals) {
    totals[currency].balanceMinor = totals[currency].approvedMinor - totals[currency].paidMinor;
  }

  return Object.values(totals);
}