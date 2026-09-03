import { NextResponse } from 'next/server';
import { getClaimById, getPaymentsForClaim, insertPayment } from '@/lib/data';
import { convertMinor } from '@/lib/claims';

// POST /api/claims/7/payments — record a payment against a claim
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const required = ['payment_date', 'currency', 'amount_minor'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  let rate;

  if (body.currency === claim.currency) {
    // Same currency, no conversion needed, rate is always 1.
    rate = 1;
  } else {
    // For Off-currency payments,
    // We require the caller to state the rate explicitly, rather than
    // guessing or calling a live FX API 
    if (body.fx_rate === undefined || body.fx_rate === null) {
      return NextResponse.json(
        { error: `Payment currency (${body.currency}) differs from claim currency (${claim.currency}). fx_rate is required.` },
        { status: 400 }
      );
    }
    rate = body.fx_rate;
  }

  const convertedAmountMinor = convertMinor(body.amount_minor, rate);

  const paymentId = insertPayment({
    claim_id: id,
    payment_date: body.payment_date,
    currency: body.currency,
    amount_minor: body.amount_minor,
    fx_rate: rate,
    converted_amount_minor: convertedAmountMinor,
  });

  return NextResponse.json({ id: paymentId, fx_rate: rate, converted_amount_minor: convertedAmountMinor }, { status: 201 });
}

// GET /api/claims/7/payments — list payments for a claim 
export async function GET(request, { params }) {
  const { id } = await params;
  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }
  const payments = getPaymentsForClaim(id);
  return NextResponse.json({ payments });
}