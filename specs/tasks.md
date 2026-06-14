# Tasks

## Phase 0 — Scaffold & foundations

### Scaffold & deps
- [x] Vite + React + TS scaffold in project root
- [x] deps: react-router-dom, zustand, lucide-react, date-fns, nanoid
- [x] Tailwind + PostCSS + Autoprefixer configured
- [x] Vitest configured (`npm run test`)
- [x] `npm run lint` works (ESLint flat config)

### Eden brand foundation (§0.5)
- [x] `tailwind.config.js` — eden.* colour tokens + serif/sans fontFamily
- [x] `index.html` — Google Fonts (Cormorant Garamond, Nunito Sans), title "Eden Caterers"
- [x] `src/components/common/EdenLogo.tsx`
- [x] Base styles: `bg-eden-cream` / `text-eden-charcoal`

### Core lib
- [x] `src/lib/types.ts` — full data model (§2)
- [x] `src/lib/stateMachine.ts` — TRANSITIONS, ROLE_TRANSITIONS, canTransition() (§3)
- [x] `src/lib/rules.ts` — isMenuAvailableForDate, menusForDate, validateMinimums, computeTotals, requiresApproval, canEditOrder, canCancelOrder (§4)
- [x] `src/lib/money.ts` — GBP formatter
- [x] `src/lib/dates.ts` — date-fns helpers for lead-time/cutoff math
- [x] `src/lib/seed.ts` — full seed per §7 (3 accounts, 7 contacts, 5 menus, 16 items, 7 orders + quote + invoice)

### Store
- [x] `src/store/useStore.ts` — state shape (§6), seeded from seed.ts
- [x] Real: setPersona, resetDemo, pushNotification, markRead
- [x] Stubbed (typed, TODO): startDraft, addLine, updateLineQty, removeLine, setDraftField, addSlot, removeSlot, submitDraft, approveOrder, rejectOrder, confirmOrder, advanceStatus, assignDriver, cancelOrder, createBackOfficeOrder, amendOrder, createMenu, updateMenu, createItem, updateItem, generateInvoice, markInvoiceSent, markInvoicePaid

### Layout & common components
- [x] `src/components/layout/AppShell.tsx`
- [x] `src/components/layout/TopBar.tsx`
- [x] `src/components/layout/PersonaSwitcher.tsx`
- [x] `src/components/layout/SideNav.tsx`
- [x] `src/components/common/StatusChip.tsx`
- [x] `src/components/common/Money.tsx`
- [x] `src/components/common/EmptyState.tsx`
- [x] `src/components/common/Modal.tsx`
- [x] `src/components/common/Field.tsx`
- [x] `src/components/common/Toast.tsx`
- [x] `src/components/common/Table.tsx`

### Routes & placeholder pages
- [x] `src/routes.tsx` — all 21 routes from §5, persona-gated, home redirects
- [x] Placeholder page files for every customer + back-office route (incl. `/login`)

### Tests (Phase 0 gate, §11.2)
- [x] `src/lib/stateMachine.test.ts` — canTransition() edges per §3
- [x] `src/lib/rules.test.ts` — requiresApproval() threshold logic
- [x] `src/lib/seed.test.ts` — seed counts

### GATE
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` succeeds
- [x] `npm run lint` clean
- [x] `npm run test` passes
- [x] Smoke: `npm run dev` — Eden branding visible, persona switch changes home+nav, all routes render placeholders

## Phase 1 — Customer ordering happy path

### lib (pure functions + tests)
- [x] `src/lib/money.ts` — `UNIT_LABELS`, `formatUnit(unit)`
- [x] `src/lib/dates.ts` — `formatFriendlyDate(iso)`, `formatFriendlyDateTime(date)`
- [x] `src/lib/rules.ts` — `getOrderMenu(order, items, menus)`, `earliestAvailableDate(menus, now, horizonDays?)`
- [x] `src/lib/rules.test.ts` — date-window boundary cases for `isMenuAvailableForDate`; tests for `getOrderMenu` and `earliestAvailableDate`

### Store
- [x] `src/store/useStore.ts` — implement `startDraft`, `addLine`, `updateLineQty`, `removeLine`, `setDraftField`, `submitDraft` (+ local `nextOrderNumber` helper)

### Shared components
- [x] `src/components/common/QtyStepper.tsx` — +/- stepper clamped to `[min, max]`
- [x] `src/components/common/Tags.tsx` — `DietaryTags`, `AllergenTags` pill rows

### Customer pages
- [x] `src/features/customer/DatePicker.tsx` — date input, Continue → `startDraft`/`setDraftField`, navigate to `/order/menus`
- [x] `src/features/customer/MenuBrowse.tsx` — `menusForDate()` cards; empty state with `earliestAvailableDate`
- [x] `src/features/customer/MenuDetail.tsx` — item cards, `QtyStepper`, dietary filter chips, add to cart, sticky cart bar
- [x] `src/features/customer/Cart.tsx` — line list, qty edit/remove, totals, minimum-violation banner
- [x] `src/features/customer/Checkout.tsx` — delivery/PO/cost-centre form, approval notice, cutoff note, submit
- [x] `src/features/customer/MyOrders.tsx` — list of the orderer's orders with `StatusChip`
- [x] `src/features/customer/OrderTrack.tsx` — status timeline + order summary + history

### GATE
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` succeeds
- [x] `npm run lint` clean
- [x] `npm run test` passes
- [x] Smoke: Emma places a Sandwich Lunch for a valid future date (PO + cost centre), sees minimum/lead-time enforcement, submits, sees it in My Orders with the right status, opens Order Track

## Phase 2 — Back-office thread (completes end-to-end)

### lib (pure functions + tests)
- [x] `src/lib/rules.ts` — `buildInvoice(order, account, now)`: invoice fields with invoiceNumber derived from orderNumber, issueDate/dueDate from `now`/`account.paymentTermsDays`, PO/cost centre and totals carried from the order
- [x] `src/lib/rules.test.ts` — `buildInvoice` carries PO + cost centre, totals match the order, invoiceNumber derivation, dueDate = issueDate + paymentTermsDays
- [x] `src/lib/stateMachine.test.ts` — full lifecycle path test: submitted→confirmed→in_production→out_for_delivery→delivered→invoiced, each step `canTransition` true for the correct role(s) and false for every other role

### Store
- [x] `src/store/useStore.ts` — implement `confirmOrder`, `advanceStatus`, `assignDriver`, `generateInvoice` (uses `buildInvoice`), `markInvoiceSent`, `markInvoicePaid`; guarded by `canTransition`, append history + notifications

### Back-office pages
- [x] `src/features/backoffice/Dashboard.tsx` — tiles: Needs confirmation, Today's deliveries, Pending approvals, Unpaid invoices, each linking to Calendar/Delivery/Invoices
- [x] `src/features/backoffice/Calendar.tsx` — week grid keyed by `eventDate`, entries colour-coded via `StatusChip`, click → `/admin/orders/:id`, prev/next week nav
- [x] `src/features/backoffice/OrderDetailAdmin.tsx` — full order fields (read), status action bar driven by `canTransition` (Confirm / Start production / Out for delivery / Delivered / Generate invoice), driver assign dropdown, history trail
- [x] `src/features/backoffice/ProductionList.tsx` — date selector; By item (aggregated qty + allergens) and By order tabs for confirmed/in_production orders on that date; "Start production" → `advanceStatus(..., 'in_production')`
- [x] `src/features/backoffice/DeliveryRunSheet.tsx` — date selector; stops sorted by `requestedDeliveryTime`, driver dropdown, Dispatch (`advanceStatus(..., 'out_for_delivery')`) and Delivered (`advanceStatus(..., 'delivered')`) actions
- [x] `src/features/backoffice/InvoiceList.tsx` — delivered orders awaiting invoice with "Generate invoice" (`generateInvoice`); invoices table with Mark sent / Mark paid

### GATE
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` succeeds
- [x] `npm run lint` clean
- [x] `npm run test` passes
- [x] Smoke: as Sam (caterer_admin), EDN-1003 (Emma's confirmed, today-dated order) appears on the Calendar today; start production via ProductionList, dispatch + deliver via DeliveryRunSheet, generate invoice via InvoiceList with PO/cost-centre carried through; switch to Emma and confirm OrderTrack reflects in_production → out_for_delivery → delivered → invoiced
