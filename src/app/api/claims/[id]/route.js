import { NextResponse } from 'next/server';
import { getClaimById, getPaymentsForClaim, updateApprovedAmount } from '@/lib/data';
import { summarizeClaim } from '@/lib/claims';

// GET /api/claims/7 — one claim with its payments and derived numbers
export async function GET(request, { params }) {
  const { id } = await params;
  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  const payments = getPaymentsForClaim(id);
  const summarized = summarizeClaim(claim, payments);

  return NextResponse.json({ claim: summarized, payments });
}

// PATCH /api/claims/7 — set or change the approved amount
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (body.approved_amount_minor === undefined || body.approved_amount_minor === null) {
    return NextResponse.json({ error: 'approved_amount_minor is required' }, { status: 400 });
  }

  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  updateApprovedAmount(id, body.approved_amount_minor);
  return NextResponse.json({ success: true });
}