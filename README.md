# Eden Caterers — Catering Ordering POC

A single-page demo showing a B2B catering order travel end-to-end —
**customer → approval → back office → invoice** — as one shared order
object, with nothing re-keyed. Branded for **Eden Caterers**, a
sustainability-led London caterer.

## Stack

React 18 + TypeScript (strict) · Vite · react-router-dom v6 · Zustand ·
Tailwind (Eden brand tokens) · lucide-react · date-fns · nanoid.

All state lives in a single in-memory Zustand store, seeded on load —
no backend, database, auth provider, or localStorage.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build
npm run lint      # eslint
npm run test      # vitest (pure-function unit tests)
npx tsc --noEmit  # type check
```

## Personas

Switch between personas via the picker in the top bar — the whole app
re-renders around that persona's role and permissions, all reading/writing
the same shared data:

| Persona | Role | Account | Lands on |
|---|---|---|---|
| Emma Hart | Orderer | Sky Media | `/order` — place orders |
| Raj Patel | Approver | Sky Media | `/approvals` — approve/reject |
| Li Wei | Orderer | RSS | `/order` |
| Sam Okafor | Caterer Admin | Eden Caterers | `/admin` — dashboard |
| Kim Nguyen | Kitchen | Eden Caterers | `/admin/production` |
| Dan Murphy | Driver | Eden Caterers | `/admin/delivery` |

## Features

### Customer ordering (Orderer)
- Pick an event date, browse menus available for that date (lead time,
  cutoff, day-of-week and active/offline rules all enforced)
- Build a cart with per-item quantity limits, allergen/dietary tags, and
  live subtotal/tax/total
- Checkout with delivery location, time, PO number, cost centre and
  department code (PO enforced if the account requires it)
- Orders over an account's approval threshold are routed to that
  account's approver before Eden ever sees them
- Track an order's live status timeline, full history log, and any
  rejection note
- **Edit** or **cancel** an order up to its menu's cutoff time

### Approvals (Approver)
- Queue of orders pending approval for your account
- Review full order detail, then **Approve** (routes on to Eden) or
  **Reject** with a required note (returns the order to the customer as a
  draft with the note visible)

### Back office (Caterer Admin)
- **Dashboard** and **Calendar** of upcoming orders
- Per-order detail with the confirm → in-production → out-for-delivery →
  delivered → invoiced workflow, one action button at a time
- **Production list** — items aggregated across orders for the kitchen
- **Delivery run sheet** with driver assignment
- **Invoices** — generate, mark sent, mark paid
- **Menu management** — create/edit menus (availability window, days,
  lead time, cutoff, minimums) and items (price, unit, quantity limits,
  allergens, dietary tags)
- **Accounts CRM** — read-only view of account terms, approval threshold,
  PO requirement, cost centres, delivery locations, contacts and full
  order history
- **Create order on behalf** — place an order for a client using the same
  builder customers use, including a one-click "Reorder" from an
  account's order history

### Notifications
- Bell in the top bar with a feed filtered to the current persona's role
  (new order, approval requested/approved/rejected, confirmed, out for
  delivery, delivered, invoice sent)
- Toasts on new notifications; clicking one marks it read and jumps to
  the order

## Key guarantees

- **One shared `orders` array** — every view reads/mutates the same order;
  nothing is duplicated or re-keyed between customer and back-office
  screens.
- **Immutable snapshots** — editing a menu item's name/price/allergens
  never changes `nameSnapshot`/`unitPriceSnapshot`/`allergenSnapshot` on
  existing order lines. Historical orders keep the price the customer was
  charged; new orders pick up the new price.
- **Pure business logic** — eligibility, totals, approval routing and
  status transitions live in `src/lib/rules.ts` and
  `src/lib/stateMachine.ts`, unit-tested with Vitest.

## Out of scope

Group ordering, card payments, and multi-slot ordering (a stretch Phase 4)
are not built. All accounts bill on account.
