# Mini Claims Register

A small web app for registering insurance claims and recording payments against them, built for the Phrontlyne Technologies pre-employment exercise.

**Live app:** https://mini-claims-register-6mtv.onrender.com/
*(Free-tier hosting — the first load after a period of inactivity may take 20–30 seconds while the service wakes up.)*

## Stack

- **Next.js** (App Router) — both the frontend pages and the backend API routes live in one project.
- **SQLite** (via `better-sqlite3`) — a single-file database, no separate server to run.
- **Tailwind CSS** — styling.
- Hosted on **Render** (free web service).

## Running it locally

```bash
git clone https://github.com/MyBaida/mini-claims-register.git
cd mini-claims-register
npm install
npm run db:init
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`. The seed script loads 16 sample claims covering every status, all four supported currencies, and an off-currency payment scenario.

To run the unit tests for the balance/status/currency logic:
```bash
npm test
```

## Data model

**claims** — policy number, insured name, loss date, notified date, loss nature, currency, estimated loss, and an optional approved amount (`NULL` until someone approves a figure — this is what drives the "Reserved" status).

**payments** — belongs to a claim; its own date, currency, and amount, plus the FX rate used and the resulting amount converted into the claim's currency.

Balance and status are never stored — they're always calculated live from `approved_amount_minor` and the sum of payments, so they can never drift out of sync with reality. All money is stored as integer minor units (cents) to avoid floating-point rounding errors, and only converted to a decimal for display, right at the point it's shown on screen.

## Handling a payment in a different currency than the claim

A claim is reserved in one currency. A payment can be made in a different one. When that happens, the server (never the person entering the payment) determines the conversion rate:

1. Same currency as the claim → rate is `1`, no conversion needed.
2. Different currency → the server tries a live exchange rate API first.
3. If that's unreachable, it falls back to a small fixed rate table.

Whichever rate was used is stored permanently on that payment record, alongside the payment's original, untouched currency and amount. This means a claim's balance is always calculated in one consistent currency, and a historical payment's converted value never silently changes if rates move later.

## Assumptions made

- **No authentication or access control.** The brief asks for a live URL reviewable without any setup — anyone with the link can view and edit data. Appropriate for this exercise; not appropriate for a real deployment.
- **No delete functionality anywhere.** Claims and payments are treated as an audit trail, consistent with how real financial/insurance records are handled — only creates and the one necessary update (setting/revising the approved amount) are supported.
- **The approved amount can be updated at any time**, including after a claim is already fully paid — this reflects real claims handling, where an approved figure is often revised. There's no history kept of previous approved amounts (see below).
- **Overpayment is allowed.** If total paid exceeds the approved amount, the balance goes negative and the status is still "Settled and paid" rather than blocking the payment.
- **Only four currencies are supported** (GHS, USD, GBP, EUR), matching the seed data and keeping the supported-currency list small and explicit.
- **`policy_number` is a plain text field**, not a foreign key to a separate policies table — out of scope for what was asked.
- **The database resets to seed data whenever the free-tier host spins the service down and back up** (Render's free tier has an ephemeral filesystem — persistent disks require a paid plan). This is acceptable for a demo/review context; see "what I'd do differently" below for the production fix.

## What I'd do differently with more time

- Move off SQLite onto a real managed database (e.g. Render's free Postgres) so data survives independently of the web service's own lifecycle, instead of resetting on sleep/wake.
- Keep a history of approved-amount revisions (who/when/from what to what) rather than overwriting the figure with no record of the previous value.
- Model `policy_number` as a proper foreign key to a `policies` table, so one policy can be linked to multiple claims over its life.
- Cache the live FX rate briefly (e.g. for an hour) rather than calling out on every single payment, to reduce external dependency load if payment volume grew.
- Add authentication and role-based access control — e.g. only certain roles able to set an approved amount, with every claim/payment action attributed to whoever performed it (which would also make the approved-amount revision history mentioned above meaningful, since you'd know *who* changed it).
- Add input masking/formatting for numeric fields (e.g. thousand separators while typing).
- Address the blank state of `<input type="date">` on mobile browsers (iOS Safari in particular renders date inputs as completely empty until a date is selected, regardless of the `placeholder` attribute — a custom date picker component or a JS polyfill would be needed to show a visible hint).

## Testing checklist

Manually verified: creating a claim, setting/updating an approved amount, recording a same-currency payment, recording an off-currency payment (rate applied and shown), filtering the list by date range/status/currency, totals row correctness per currency (including with pagination applied), and overpayment producing a negative balance with "Settled and paid" status.