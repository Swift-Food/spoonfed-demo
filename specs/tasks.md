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
