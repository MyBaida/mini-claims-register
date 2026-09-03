import { NextResponse } from 'next/server';
import { getAllClaims, getPaymentsForClaim, insertClaim } from '@/lib/data';
import { summarizeClaim, groupTotalsByCurrency } from '@/lib/claims';

// GET /api/claims?currency=GHS&status=Reserved...&from=2026-01-01&to=2026-04-01
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const claims = getAllClaims();

  let summarized = claims.map((claim) => {
    const payments = getPaymentsForClaim(claim.id);
    return summarizeClaim(claim, payments);
  });

  if (currency) summarized = summarized.filter((c) => c.currency === currency);
  if (status) summarized = summarized.filter((c) => c.status === status);
  if (from) summarized = summarized.filter((c) => c.loss_date >= from);
  if (to) summarized = summarized.filter((c) => c.loss_date <= to);

  const totals = groupTotalsByCurrency(summarized);

  return NextResponse.json({ claims: summarized, totals });
}

// POST /api/claims — register a new claim
export async function POST(request) {
  const body = await request.json();

  const required = [
    'policy_number', 'insured_name', 'loss_date', 'notified_date',
    'loss_nature', 'currency', 'estimated_loss_minor',
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const id = insertClaim(body);
  return NextResponse.json({ id }, { status: 201 });
}