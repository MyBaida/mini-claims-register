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

To run the test suite (34 tests covering claim calculations, FX conversion logic, and data-access layer queries against an in-memory SQLite database):
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
- **Claims and payments are currently immutable once recorded.** Consistent with how real financial/insurance records are handled as an audit trail — only creates and the one necessary update (setting/revising the approved amount) are supported. Editing would be a natural extension (see "what I'd do differently" below).
- **The approved amount can be updated at any time**, including after a claim is already fully paid — this reflects real claims handling, where an approved figure is often revised. There's no history kept of previous approved amounts (see below).
- **Overpayment is allowed.** If total paid exceeds the approved amount, the balance goes negative and the status is still "Settled and paid" rather than blocking the payment.
- **Only four currencies are supported** (GHS, USD, GBP, EUR), matching the seed data and keeping the supported-currency list small and explicit.
- **`policy_number` is a plain text field**, not a foreign key to a separate policies table — out of scope for what was asked.
- **Date constraints are enforced on both frontend and backend.** Loss date and notified date cannot be in the future, notified date cannot precede loss date, and payment dates must fall between the claim's notified date and today.
- **Input validation is enforced on both frontend and backend.** All three text fields accept letters from any language (including accented characters). Policy numbers allow letters, numbers, hyphens, and periods. Insured names allow letters, spaces, hyphens, apostrophes, and periods. Loss nature must contain at least one letter and allows letters, numbers, and basic punctuation. All fields reject emojis and special symbols.
- **The database resets to seed data whenever the free-tier host spins the service down and back up** (Render's free tier has an ephemeral filesystem — persistent disks require a paid plan). This is acceptable for a demo/review context; see "what I'd do differently" below for the production fix.

## What I'd do differently with more time

- Move off SQLite onto a real managed database (e.g. Render's free Postgres) so data survives independently of the web service's own lifecycle, instead of resetting on sleep/wake.
- Keep a history of approved-amount revisions (who/when/from what to what) rather than overwriting the figure with no record of the previous value.
- Model `policy_number` as a proper foreign key to a `policies` table, so one policy can be linked to multiple claims over its life.
- Cache the live FX rate briefly (e.g. for an hour) rather than calling out on every single payment, to reduce external dependency load if payment volume grew.
- Add authentication and role-based access control — e.g. only certain roles able to set an approved amount, with every claim/payment action attributed to whoever performed it (which would also make the approved-amount revision history mentioned above meaningful, since you'd know *who* changed it).
- Add input masking/formatting for numeric fields (e.g. thousand separators while typing).
- Add claim and payment editing — with a clear policy on which fields can be edited, whether FX rates should be re-fetched at current rates or preserved from the original transaction, and an audit trail for any changes.
- Add claim status management (suspend/cancel) and payment reversal capabilities while preserving the audit trail — rather than deleting records, mark them as inactive or create offsetting entries.
- Add free-text search by policy number or insured name — not required by the brief, but a natural extension of the existing filters.
- Address the blank state of `<input type="date">` on mobile browsers (iOS Safari in particular renders date inputs as completely empty until a date is selected, regardless of the `placeholder` attribute — a custom date picker component or a JS polyfill would be needed to show a visible hint).

## Testing

**Automated tests (34 passing):**
- Claim calculations: balance derivation, status computation (Reserved/Settled payment outstanding/Settled and paid), currency-grouped totals, minor unit conversions
- FX conversion: fallback rate consistency, bidirectional rate checks, live API integration with timeout handling
- Data-access layer: CRUD operations (insert, read, update) for claims and payments against an in-memory SQLite database

Run with `npm test`.

**Manual verification:**
- Creating claims with various field combinations
- Setting and updating approved amounts
- Recording same-currency and off-currency payments (FX rate applied and displayed)
- Filtering by date range, status, and currency
- Totals row correctness per currency (including with pagination applied)
- Overpayment producing a negative balance with "Settled and paid" status
- Date constraints: loss date and notified date cannot be in the future, notified date cannot precede loss date, payment dates must fall between claim's notified date and today
- Input validation: policy numbers, insured names, and loss nature accept letters from any language (including accented characters) while rejecting emojis and special symbols
- Mobile responsiveness: layout reordering (payment history at bottom), date picker UX
- Readable date formatting: dates display as "02 Jan 2026" instead of ambiguous ISO format