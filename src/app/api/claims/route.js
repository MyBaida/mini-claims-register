import { NextResponse } from 'next/server';
import { getAllClaims, getPaymentsForClaim, insertClaim } from '@/lib/queries';
import { summarizeClaim, groupTotalsByCurrency } from '@/lib/claims';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

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
  const totalCount = summarized.length;

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const start = (page - 1) * pageSize;
  const paginated = summarized.slice(start, start + pageSize);

  return NextResponse.json({ claims: paginated, totals, totalCount, page, pageSize });
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

  if (!/^[A-Za-z0-9\s.\-']+$/.test(body.policy_number)) {
    return NextResponse.json({ error: 'policy_number can only contain letters, numbers, hyphens, and periods' }, { status: 400 });
  }
  if (!/^[A-Za-z\s'.\-]+$/.test(body.insured_name)) {
    return NextResponse.json({ error: 'insured_name can only contain letters, spaces, hyphens, and apostrophes' }, { status: 400 });
  }
  if (!/[a-zA-Z]/.test(body.loss_nature) || !/^[A-Za-z0-9\s.,'\-]+$/.test(body.loss_nature)) {
    return NextResponse.json({ error: 'loss_nature must contain letters and can only include letters, numbers, and basic punctuation' }, { status: 400 });
  }

  if (!SUPPORTED_CURRENCIES.includes(body.currency)) {
    return NextResponse.json(
      { error: `currency must be one of ${SUPPORTED_CURRENCIES.join(', ')}` },
      { status: 400 }
    );
  }

  const estimated = Number(body.estimated_loss_minor);
  if (!Number.isFinite(estimated) || estimated < 0) {
    return NextResponse.json({ error: 'estimated_loss_minor must be a non-negative number' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  if (body.loss_date > today) {
    return NextResponse.json({ error: 'loss_date cannot be in the future' }, { status: 400 });
  }
  if (body.notified_date > today) {
    return NextResponse.json({ error: 'notified_date cannot be in the future' }, { status: 400 });
  }
  if (body.notified_date < body.loss_date) {
    return NextResponse.json({ error: 'notified_date cannot be before loss_date' }, { status: 400 });
  }

  const id = insertClaim(body);
  return NextResponse.json({ id }, { status: 201 });
}