import { NextResponse } from 'next/server';
import { getClaimById, getPaymentsForClaim, insertPayment } from '@/lib/data';
import { convertMinor } from '@/lib/claims';
import { getExchangeRate } from '@/lib/fx';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

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

  if (!SUPPORTED_CURRENCIES.includes(body.currency)) {
    return NextResponse.json(
      { error: `currency must be one of ${SUPPORTED_CURRENCIES.join(', ')}` },
      { status: 400 }
    );
  }

  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  // Tries a live FX rate first, falls back to a fixed table if unavailable.
  const { rate, source } = await getExchangeRate(body.currency, claim.currency);
  const convertedAmountMinor = convertMinor(body.amount_minor, rate);

  const paymentId = insertPayment({
    claim_id: id,
    payment_date: body.payment_date,
    currency: body.currency,
    amount_minor: body.amount_minor,
    fx_rate: rate,
    converted_amount_minor: convertedAmountMinor,
  });

  return NextResponse.json(
    { id: paymentId, fx_rate: rate, fx_source: source, converted_amount_minor: convertedAmountMinor },
    { status: 201 }
  );
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