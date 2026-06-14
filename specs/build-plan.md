# Spoonfed POC — Engineering Build Plan (AI Coding Agent Brief)

**From:** Engineering Lead
**To:** AI Coding Agent
**Client / brand:** **Eden Caterers** (https://www.edencaterers.london) — London's sustainability-led caterer since 1993. The demo must look and feel like *their* product, not a generic ordering app. Theme everything per the Eden brand system in **§0.5**.
**Goal:** Build a single front-end demo app that shows a B2B catering order travelling end-to-end — customer places it → caterer works it through production and delivery → it becomes an invoice — with nothing re-keyed.
**Excluded from this build:** group ordering, card payments. (All accounts bill on account.)

> Read this whole document before writing code. Every type, route, store action, business rule, seed record, **and brand token** you need is defined here. Build the phases in order; each phase is independently runnable. Do not introduce a backend, a database, or auth providers — state lives in a single in-memory store seeded at startup. The caterer org throughout the app is **Eden Caterers**.

---

## 0. Locked technology decisions (do not deviate)

| Concern | Choice | Notes |
|---|---|---|
| Language | **TypeScript** (strict) | All entities typed per §2. |
| Framework | **React 18** | Function components + hooks only. |
| Build tool | **Vite** | `npm create vite@latest -- --template react-ts`. |
| Routing | **react-router-dom v6** | Routes per §5. |
| State | **Zustand** (single store) | The shared order store; no Redux, no Context soup. |
| Styling | **Tailwind CSS** | Utility classes, themed with the **Eden brand tokens in §0.5** (put them in `tailwind.config.js`). |
| Icons | **lucide-react** | |
| Dates | **date-fns** | Lead-time / cut-off math. |
| IDs | **nanoid** | For new records. |
| Persistence | **In-memory only** | Seed on app load; a "Reset demo" button re-seeds. No localStorage (keeps demos deterministic). |
| Tests | **Minimal, as a self-verification gate** | Vitest unit tests on the **pure** functions only (`rules.ts`, `stateMachine.ts`) — these are the agent's runnable check per phase (§11). No UI/E2E test suite. |

**Layout:** customer portal is mobile-first responsive; back office is desktop-first (assume ≥1024px). One app, one store, persona switcher in the top bar.

---

## 0.5 Brand & design system — Eden Caterers (apply everywhere)

Eden is a premium, warm, **sustainability-led** caterer. The visual language is *garden / fresh / seasonal* — natural greens, soft cream paper, an elegant feel — never the clinical blue of a generic SaaS dashboard. The customer portal especially should feel like Eden's website; the back office can be calmer/denser but uses the same palette.

**Brand essence to channel:** fresh, seasonal, sustainable, "good for people and the planet," refined, trustworthy, London. High proportion of veg/vegan; UK ingredients; free-range/sustainably sourced. Lean into that in copy and dietary emphasis.

> The hex values below are an on-brand palette derived from Eden's identity (deep garden green + fresh leaf + cream + charcoal, with a warm berry accent). They are demo-ready. **If the client supplies exact brand hex/fonts/logo assets, swap them into `tailwind.config.js` and the logo component — everything else inherits.** Centralise all colour in the Tailwind theme; never hard-code hex in components.

### Colour tokens (`tailwind.config.js → theme.extend.colors`)
```js
eden: {
  green:   '#1F4D2E', // primary — deep garden green (headers, primary buttons, nav)
  leaf:    '#4E944F', // secondary — fresh leaf (accents, success, active)
  sage:    '#A7C4A0', // muted green (subtle fills, borders, hover)
  cream:   '#F7F4EC', // app background — warm off-white "paper"
  sand:    '#EDE6D6', // card/section background, table stripes
  charcoal:'#2B2B26', // primary text
  stone:   '#6F6F66', // secondary text / labels
  berry:   '#9C3D54', // warm accent — alerts/CTAs sparingly, attention badges
  amber:   '#C98A3A', // warning / pending highlight
}
```
Backgrounds default to `eden.cream`; cards/sand panels on top; text `eden.charcoal`/`eden.stone`. Primary actions = solid `eden.green` with cream text; secondary = outline `eden.green`; success/positive = `eden.leaf`.

### Typography
- **Headings:** an elegant serif — use **"Cormorant Garamond"** (Google Fonts), weight 500–600. Gives the refined, food-led feel.
- **Body / UI:** a clean humanist sans — **"Nunito Sans"** (Google Fonts). Readable, warm.
- Load both via `<link>` in `index.html`; map in Tailwind: `fontFamily: { serif: ['"Cormorant Garamond"',...], sans: ['"Nunito Sans"',...] }`. Use `font-serif` for page titles/menu names, `font-sans` everywhere else.

### Logo & motif
- Eden's mark is a **flower/bloom**. Build a small `<EdenLogo/>` component: a simple flower glyph (lucide `Flower2` is an acceptable stand-in) in cream on an `eden.green` circle, beside the wordmark **"Eden Caterers"** in `font-serif`. Use it in the TopBar and on the login screen.
- Optional subtle botanical motif: a faint leaf/flower SVG watermark on the login and dashboard headers at ~5% opacity. Keep it tasteful, never busy.

### Component styling rules
- **Buttons:** rounded-lg, generous padding; primary `bg-eden-green hover:bg-eden-leaf text-eden-cream`; secondary `border border-eden-green text-eden-green hover:bg-eden-sage/30`. No hard shadows — soft `shadow-sm`.
- **Cards:** `bg-white/`(or `eden.sand`) rounded-xl, 1px `eden.sage/40` border, soft shadow. Menu/item cards lead with the food image, name in `font-serif`.
- **Dietary tags & allergens:** dietary tags as small pill chips tinted `eden.leaf`/`eden.sage`; allergens as muted `eden.stone` outline pills. Surface vegan/vegetarian prominently (Eden's positioning).
- **Inputs:** cream/white fields, `eden.sage` borders, `eden.green` focus ring.
- **Nav/side nav:** `eden.green` background, cream text, `eden.leaf` active indicator.

### Status → colour mapping (use in `StatusChip`, calendar, timelines)
| Status | Colour token | Customer label |
|---|---|---|
| draft | `stone` | Draft |
| pending_approval | `amber` | Awaiting approval |
| submitted | `leaf` | Received |
| confirmed | `green` | Confirmed |
| in_production | `sage` (on green text) | Being prepared |
| out_for_delivery | `leaf` | Out for delivery |
| delivered | `green` | Delivered |
| invoiced | `stone` | Invoiced |
| cancelled | `berry` | Cancelled |

### Tone of copy (microcopy throughout)
Warm and food-forward, lightly sustainability-aware. Examples: empty menu state → "Nothing fresh for that date yet — our kitchen needs a little more notice. The earliest we can cater this is {date}."; order confirmed → "Eden's got it — your order's confirmed."; footer line → "Fresh, seasonal, sustainable catering since 1993." Avoid corporate-SaaS phrasing.

---

## 1. Architecture in one paragraph

A single React SPA. A Zustand store holds all data (accounts, contacts, menus, items, orders, invoices, notifications) plus the current persona. The customer-facing routes and the back-office routes both read and mutate the **same `orders` array** — that shared object is the entire point. A persona switcher sets `currentPersona` (role + account + contact), which gates what each view shows and which state transitions are allowed. Pure helper functions in `lib/` implement the business rules (date availability, minimums, approval, edit/cancel guards) and the order state machine. No network calls.

```
src/
  main.tsx, App.tsx
  store/useStore.ts            ← Zustand store: state + all actions
  lib/
    types.ts                   ← every entity & enum (§2)
    stateMachine.ts            ← transitions + canTransition() (§3)
    rules.ts                   ← business-rule functions (§4)
    money.ts, dates.ts         ← formatting helpers
    seed.ts                    ← seed data (§7)
  components/
    layout/ (TopBar, PersonaSwitcher, AppShell, SideNav)
    common/ (StatusChip, Money, EmptyState, Modal, Field, Table, Toast)
  features/
    customer/  (pages + components, §6.A)
    backoffice/ (pages + components, §6.B)
  routes.tsx                   ← route table (§5)
```

---

## 2. Data model — `lib/types.ts` (build exactly this)

```ts
export type Role = 'orderer' | 'approver' | 'caterer_admin' | 'kitchen' | 'driver';

export type OrderStatus =
  | 'draft' | 'pending_approval' | 'submitted' | 'confirmed'
  | 'in_production' | 'out_for_delivery' | 'delivered' | 'invoiced' | 'cancelled';

export type ServiceType = 'single' | 'multi_slot';
export type Unit = 'per_person' | 'per_platter' | 'each';
export type Allergen = 'gluten'|'dairy'|'nuts'|'egg'|'soy'|'shellfish';
export type DietaryTag = 'vegan'|'vegetarian'|'gluten_free'|'halal';

export interface DeliveryLocation { building: string; room: string; }

export interface Account {
  id: string;
  name: string;
  paymentTermsDays: number;
  requiresApproval: boolean;        // if true, threshold applies
  approvalThreshold: number;        // orders >= this need approval
  poRequired: boolean;
  costCentres: string[];
  deliveryLocations: DeliveryLocation[];
  active: boolean;
}

export interface Contact {
  id: string; accountId: string; name: string; email: string;
  role: Role; phone?: string;
}

export interface Item {
  id: string; menuId: string; name: string; description: string;
  price: number; unit: Unit; minQty: number; maxQty: number;
  allergens: Allergen[]; dietary: DietaryTag[]; portion: string;
  imageUrl?: string; available: boolean;
}

export interface Menu {
  id: string; name: string; description: string; serviceType: ServiceType;
  availableFrom: string;            // ISO date
  availableTo: string;              // ISO date
  leadTimeHours: number;            // min hours before eventDate
  cutoffTime: string;               // 'HH:mm' on the day before/of, used with leadTime
  availableDays: number[];          // 0..6 (Sun..Sat)
  minOrderValue: number;
  minPersons: number;
  active: boolean;
  offline?: boolean;                // quote-only, hidden from portal
}

export interface OrderSlot {
  id: string; label: string; serveTime: string; // 'HH:mm'
  locationOverride?: DeliveryLocation;
}

export interface OrderLine {
  id: string; orderId: string; slotId?: string; itemId: string;
  nameSnapshot: string; unitPriceSnapshot: number; unit: Unit;
  qty: number; lineTotal: number; lineNotes?: string;
  allergenSnapshot: Allergen[];
}

export interface Order {
  id: string; orderNumber: string;
  accountId: string; placedByContactId: string;
  status: OrderStatus; isQuote: boolean;
  serviceType: ServiceType;
  eventDate: string;                // ISO date
  requestedDeliveryTime: string;    // 'HH:mm'
  headcount: number;
  deliveryLocation: DeliveryLocation; deliveryInstructions?: string;
  poNumber?: string; costCentre?: string; deptCode?: string;
  requiresApproval: boolean;
  approvalStatus: 'n/a'|'pending'|'approved'|'rejected';
  approverId?: string; approvalNote?: string;
  slots: OrderSlot[];               // empty for 'single'
  lines: OrderLine[];
  subtotal: number; deliveryFee: number; tax: number; total: number;
  source: 'customer_portal'|'back_office';
  driverId?: string;
  createdAt: string; updatedAt: string;
  history: { at: string; actorRole: Role; note: string }[];
}

export interface Invoice {
  id: string; invoiceNumber: string; orderId: string; accountId: string;
  status: 'draft'|'sent'|'paid'; issueDate: string; dueDate: string;
  poNumber?: string; costCentre?: string;
  lines: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number; tax: number; total: number;
}

export type NotificationType =
  | 'order_received'|'approval_requested'|'approved'|'rejected'
  | 'confirmed'|'out_for_delivery'|'delivered'|'invoice_sent';

export interface AppNotification {
  id: string; type: NotificationType; orderId: string;
  recipientRole: Role; message: string; createdAt: string; read: boolean;
}

export interface Persona { role: Role; accountId?: string; contactId?: string; }
```

**Rule for engineering:** lines carry `nameSnapshot`, `unitPriceSnapshot`, `allergenSnapshot`. After an order leaves `draft`, editing a Menu/Item must **not** mutate existing order lines. Demo proof depends on this.

---

## 3. Order state machine — `lib/stateMachine.ts`

```ts
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft:            ['pending_approval','submitted','cancelled'],
  pending_approval: ['submitted','draft','cancelled'], // approve→submitted, reject→draft
  submitted:        ['confirmed','cancelled'],
  confirmed:        ['in_production','cancelled'],
  in_production:    ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        ['invoiced'],
  invoiced:         [],
  cancelled:        [],
};

// who may move it
export const ROLE_TRANSITIONS: Partial<Record<OrderStatus, Role[]>> = {
  draft: ['orderer'],
  pending_approval: ['approver'],
  submitted: ['caterer_admin'],
  confirmed: ['caterer_admin','kitchen'],
  in_production: ['caterer_admin','kitchen','driver'],
  out_for_delivery: ['driver','caterer_admin'],
  delivered: ['caterer_admin'],
};

export function canTransition(order, to, role): boolean {
  return TRANSITIONS[order.status].includes(to)
      && (ROLE_TRANSITIONS[order.status]?.includes(role) ?? false);
}
```

Customer-facing status labels (map in UI): `pending_approval`→"Awaiting approval", `submitted`→"Received", `confirmed`→"Confirmed", `in_production`→"Being prepared", `out_for_delivery`→"Out for delivery", `delivered`→"Delivered", `invoiced`→"Invoiced".

---

## 4. Business rules — `lib/rules.ts` (pure functions)

```ts
isMenuAvailableForDate(menu, eventDateISO, now): boolean
// true if active, !offline, eventDate within [availableFrom,availableTo],
// getDay(eventDate) ∈ availableDays, AND (eventDate - now) hours >= leadTimeHours
// AND cutoffTime on the relevant day not passed.

menusForDate(menus, eventDateISO, now): Menu[]      // filter helper for the portal

validateMinimums(order, menu): string[]
// returns violation messages: subtotal < minOrderValue, headcount < minPersons,
// any line qty outside [item.minQty,item.maxQty].

computeTotals(lines, deliveryFee=0, taxRate=0.0): { subtotal, tax, total }

requiresApproval(account, total): boolean
// account.requiresApproval && total >= account.approvalThreshold

canEditOrder(order, now): boolean
// status ∈ {draft,submitted,confirmed} && cut-off not passed for its menu

canCancelOrder(order, now): boolean
// status ∈ {draft,pending_approval,submitted,confirmed} && cut-off not passed
```

`tax` and `deliveryFee` can be 0 for the demo (keep the fields, keep it simple). Use a flat 0 tax unless trivial to add 20% VAT — agent's choice, default 0.

---

## 5. Routes — `routes.tsx`

| Path | Persona | Page |
|---|---|---|
| `/login` | any | PersonaPicker (choose role + account) |
| `/order` | orderer | DatePicker (choose event date) |
| `/order/menus` | orderer | MenuBrowse (date-aware list) |
| `/order/menu/:menuId` | orderer | MenuDetail (items + add to cart) |
| `/cart` | orderer | Cart |
| `/checkout` | orderer | Checkout |
| `/orders` | orderer | MyOrders |
| `/orders/:id` | orderer | OrderTrack |
| `/approvals` | approver | ApprovalQueue |
| `/approvals/:id` | approver | ApprovalDetail |
| `/admin` | caterer_admin | Dashboard |
| `/admin/calendar` | caterer_admin | Calendar |
| `/admin/orders/new` | caterer_admin | CreateOrderOnBehalf |
| `/admin/orders/:id` | caterer_admin | OrderDetailAdmin |
| `/admin/production` | caterer_admin/kitchen | ProductionList |
| `/admin/delivery` | caterer_admin/driver | DeliveryRunSheet |
| `/admin/menus` | caterer_admin | MenuManager |
| `/admin/menus/:id` | caterer_admin | MenuEditor |
| `/admin/accounts` | caterer_admin | AccountList (CRM) |
| `/admin/accounts/:id` | caterer_admin | AccountDetail |
| `/admin/invoices` | caterer_admin | InvoiceList |

Persona switching redirects to that persona's home (`orderer→/order`, `approver→/approvals`, `caterer_admin→/admin`). Guard routes by persona; on mismatch redirect home.

---

## 6. Store actions — `store/useStore.ts`

```ts
state: { accounts, contacts, menus, items, orders, invoices, notifications,
         persona, draftOrder /* in-progress customer order */ }

// persona
setPersona(persona)

// customer ordering
startDraft({ accountId, contactId, eventDate })   // creates draftOrder skeleton
addLine(itemId, qty, slotId?)                     // snapshots name/price/allergens
updateLineQty(lineId, qty); removeLine(lineId)
setDraftField(patch)                              // headcount, delivery, po, etc.
addSlot(slot); removeSlot(slotId)                 // multi-slot (Phase 4)
submitDraft()  // computes totals+approval; status→pending_approval|submitted; notify

// approval
approveOrder(orderId, note)   // →submitted; notify orderer + caterer
rejectOrder(orderId, note)    // →draft; notify orderer

// back office
confirmOrder(orderId)                 // submitted→confirmed; notify
advanceStatus(orderId, toStatus)      // guarded by canTransition
assignDriver(orderId, driverId)
cancelOrder(orderId, note)
createBackOfficeOrder(payload)        // source='back_office'
amendOrder(orderId, patch)            // re-validates, flags 'amended' in history

// menus
createMenu / updateMenu / createItem / updateItem

// invoices
generateInvoice(orderId)              // delivered→invoiced; carries PO/costCentre
markInvoiceSent(id); markInvoicePaid(id)

// notifications
pushNotification(n); markRead(id)

// demo
resetDemo()  // re-run seed
```

Every mutating action appends to `order.history` and bumps `updatedAt`. Status-changing actions call `pushNotification`.

---

## 6.A Customer components (mobile-first)

- **PersonaPicker** — cards for each seeded persona; sets persona, routes home.
- **DatePicker** — calendar/date input; "Continue" → `/order/menus`. Stores chosen date in draft.
- **MenuBrowse** — `menusForDate()` results as cards; empty state (OO-6) explaining lead-time/cut-off and earliest valid date when none.
- **MenuDetail** — item cards: name, desc, price+unit, dietary tags, allergen pills, qty stepper (clamped to min/max), add to cart. Dietary filter chips.
- **Cart** — line list, qty edit/remove, running subtotal, minimum-violation banner, "Checkout".
- **Checkout** — fields: headcount, delivery location (dropdown from account + free-text), delivery time, instructions, **PO number** (required if `account.poRequired`), **cost centre** (dropdown), dept code; review summary with totals + "you can edit until {cutoff}"; Submit. If `requiresApproval(total)` show "this will be sent for approval".
- **MyOrders** — list with StatusChip + event date; click → track.
- **OrderTrack** — friendly status timeline, order summary, Edit/Cancel buttons enabled per `canEditOrder/canCancelOrder`, rejection note if rejected.

## 6.B Back-office components (desktop-first)

- **AppShell + SideNav** — nav to Dashboard, Calendar, Production, Delivery, Menus, Accounts, Invoices.
- **Dashboard** — tiles: Needs confirmation, Today's deliveries, Pending approvals, Unpaid invoices (each links to filtered list).
- **Calendar** — week/day grid keyed by `eventDate`, entries colour-coded by status; click → OrderDetailAdmin. This is where a portal order visibly appears.
- **OrderDetailAdmin** — all order fields (read), status action bar (Confirm / advance / cancel — buttons shown only when `canTransition`), history trail, driver assign.
- **CreateOrderOnBehalf** — pick account (auto-fills locations, cost centres, PO rule), then same builder as customer; `source='back_office'`.
- **ProductionList** — date selector; two tabs: **By item** (sum qty per item across confirmed/in_production orders, with allergens) and **By order** (pick/pack per order). "Start production" advances confirmed→in_production.
- **DeliveryRunSheet** — date selector; stops sorted by `requestedDeliveryTime`: address/room, contact, items summary, instructions, driver dropdown, Dispatch (→out_for_delivery), Delivered checkbox (→delivered).
- **MenuManager / MenuEditor** — menu list + CRUD; item CRUD within a menu; toggles for active/offline/availability.
- **AccountList / AccountDetail** — CRM: account config (terms, approval, cost centres, locations), contacts, order history with re-order link.
- **InvoiceList** — invoices with status; from a delivered order, "Generate invoice"; mark sent/paid.
- **NotificationBell** (in TopBar) — feed filtered to current persona's role; toast on new.

---

## 7. Seed data — `lib/seed.ts` (concrete, so every screen is populated)

The caterer organisation is **Eden Caterers** (199 Hercules Road, London SE1 7LD). Customer accounts are realistic London corporate clients. Menus and items mirror Eden's real range and sustainable ethos (seasonal, high veg/vegan, UK ingredients, free-range/sustainably sourced). Prices in **GBP (£)**.

**Accounts** (Eden's clients)
- `acc_sky` — "Sky Media", terms 30, requiresApproval true, threshold **250**, poRequired true, costCentres ["Production","Events","Marketing"], locations [{"Osterley Campus","Boardroom 1"},{"Osterley Campus","Studio Mezz"}].
- `acc_rss` — "Royal Statistical Society", terms 45, requiresApproval false, poRequired true, costCentres ["Events","Membership"], locations [{"Errol Street","Council Room"}].
- `acc_9others` — "9Others", terms 14, requiresApproval false, poRequired false, costCentres ["G&A"], locations [{"Clerkenwell Studio","Event Space"}].

**Contacts**
- `con_emma` orderer @ Sky; `con_raj` approver @ Sky; `con_li` orderer @ RSS; `con_sam` caterer_admin (Eden head office); `con_kim` kitchen (Eden); `con_dan` driver (Eden).

**Menus** — use Eden's real category names (eventDate logic uses today as `now`)
- `menu_sandwich` "Sandwich Lunch", single, available next ~60 days, leadTimeHours 24, cutoff "10:00", days Mon–Fri, minOrderValue 60, minPersons 5.
- `menu_breakfast` "Breakfast", single, leadTimeHours 18, cutoff "15:00", Mon–Fri, minOrderValue 40, minPersons 4.
- `menu_forkbuffet` "Fork Buffet & Salads", multi_slot-capable but seed as single, leadTimeHours 48, cutoff "12:00", Mon–Fri, minOrderValue 200, minPersons 10.
- (Optional extra cards for flavour, can be active with a couple of items each: "Hot Bowl Meals", "Canapés", "Afternoon Tea", "Drinks".)

**Items** (6–10 across menus, mixed units & tags; emphasise vegan/vegetarian and seasonality). Examples for `menu_sandwich`:
- Seasonal Sandwich Platter (per_platter, £28, serves 6, allergens gluten/dairy), Vegan Wrap Selection (per_platter, £26, vegan), Heritage Tomato & Leaf Salad Bowl (per_person, £6.50, vegetarian, gluten_free), British Fruit Platter (per_platter, £18, vegan), Free-range Egg & Cress Rounds (per_platter, £22, vegetarian, allergens gluten/egg/dairy), Still/Sparkling (each, £1.50).
For `menu_breakfast`: Bircher & Granola Pots (per_person, £4.50, vegetarian), Seasonal Fruit Box (per_person, £3.75, vegan), Bacon/Veggie Rolls (each, £4.25, free-range). For `menu_forkbuffet`: Roast Seasonal Veg & Grains (per_person, £9.50, vegan, gluten_free), Sustainably-sourced Salmon (per_person, £12, allergens fish), Free-range Chicken Traybake (per_person, £11). Give each its own allergens/dietary set.

**Orders** (so back-office views are alive **today**)
- 1 `draft` (Sky, future date) — for the edit/cancel demo.
- 1 `pending_approval` (Sky, total > £250) — populates approvals queue.
- 2 `confirmed` dated **today** (one Sky, one RSS) — populate Production + Delivery.
- 1 `delivered` (not yet invoiced) — for Billing demo.
- 1 `invoiced` (+ its Invoice) — shows a completed thread.
- 1 quote (`isQuote=true`).
Generate `orderNumber` like `EDN-1001…`. Pre-build `lines` with snapshots and computed totals.

`resetDemo()` rebuilds all of the above.

---

## 8. Phase plan (build in this order)

### Phase 0 — Scaffold & foundations
Scaffold Vite+React+TS+Tailwind; install deps (§0); implement `types.ts`, `stateMachine.ts`, `rules.ts`, `seed.ts`, the Zustand store with **all** actions stubbed/real, `AppShell`, `TopBar`, `PersonaSwitcher`, `routes.tsx` with placeholder pages, `StatusChip`, `Money`, `EmptyState`, `Modal`, `Field`, `Toast`, `resetDemo`.
**Done when:** app runs, persona switch changes home + nav, store is seeded and inspectable, every route renders a placeholder.

### Phase 1 — Customer ordering happy path
DatePicker → MenuBrowse (date-aware via `menusForDate`) → MenuDetail (qty clamps) → Cart (minimums) → Checkout (PO/cost-centre, approval notice) → submit → MyOrders + OrderTrack. Account billing only.
**Done when:** Emma (Sky Media) can place a Sandwich Lunch for a valid future date with PO+cost centre, see minimum/lead-time enforcement, submit, and watch it in MyOrders with the right status — in full Eden branding (§0.5).

### Phase 2 — Back-office thread (completes end-to-end)
Dashboard, Calendar, OrderDetailAdmin, ProductionList, DeliveryRunSheet, InvoiceList + generateInvoice. Wire status transitions through the state machine.
**Done when:** the order Emma placed appears on the Calendar; Sam confirms it → it shows on today's Production (if dated today) and Delivery; dispatch → delivered → invoice generated with PO carried through; Emma's OrderTrack reflects each step.

### Phase 3 — Differentiators
Approval flow (ApprovalQueue/Detail + routing of ≥threshold orders); MenuManager/MenuEditor with live effect on future portal orders + snapshot proof; AccountList/Detail (CRM) with order history; NotificationBell feed; CreateOrderOnBehalf; edit/cancel guards surfaced in UI.
**Done when:** a >£250 Sky Media order routes to Raj, who approves it before Sam (Eden) sees it; editing an item price changes a new order but not a historical one; notifications appear per persona.

### Phase 4 — Multi-slot (stretch, optional)
Slot add/label/serve-time in the builder for `menu_forkbuffet` (all-day events); lines grouped by slot in Cart/Checkout/OrderDetail; ProductionList still aggregates by item; DeliveryRunSheet shows slot serve times as separate stops.
**Done when:** an all-day Fork Buffet order with 2–3 slots flows through without breaking the by-item production aggregation.

---

## 9. Acceptance checklist (the demo must pass all of Phases 0–3)

- [ ] Persona switcher moves between Orderer / Approver / Caterer (+ kitchen/driver) and gates views.
- [ ] Date chosen first; only valid menus show; clear empty state when none.
- [ ] Item min/max, menu min value/persons, and lead-time/cut-off all enforced with visible messaging.
- [ ] PO (required where configured) and cost centre captured and carried to back office **and** invoice.
- [ ] Orders ≥ account threshold route to approval before reaching the caterer; reject returns to draft with note.
- [ ] One order object: portal-placed order appears on the back-office Calendar; status changes on the back office show on customer OrderTrack.
- [ ] Production list aggregates confirmed orders by item and by order with allergens.
- [ ] Delivery run sheet lists stops by time; dispatch and delivered transitions work.
- [ ] Invoice generated from a delivered order with PO/cost-centre carried through.
- [ ] Editing a menu/item affects new future orders only; historical order lines unchanged (snapshot proof).
- [ ] "Reset demo" restores the seeded state cleanly.
- [ ] **Eden brand applied throughout:** §0.5 palette/typography/logo in place, all colour via Tailwind tokens (no hard-coded hex), Eden Caterers wordmark + flower mark, warm food-forward microcopy, status chips use the Eden status→colour map. The portal should be recognisably "Eden", not generic SaaS.

---

## 10. Guardrails for the agent

- Keep it a **single SPA, no backend, no localStorage**. If you think you need a server, you don't — use the store.
- Do not add libraries beyond §0 without strong reason.
- Prefer clarity over cleverness; this is shown to a client, so empty states, status colours and totals must look intentional.
- Money is stored as numbers (e.g. 28.0) and formatted at the edge via `Money`/`money.ts`; currency is **GBP (£)**.
- All dates ISO in state; format only for display.
- **Brand is not optional.** Apply §0.5 from Phase 0 (theme the shell, logo, fonts and tokens first) so every later screen inherits Eden's look. All colour comes from Tailwind `eden.*` tokens — if you're typing a hex in a component, stop and use a token. If the client later provides exact brand assets, only `tailwind.config.js`, the font links, and `<EdenLogo/>` should need to change.
- Build Phase 0 → 4 in order and keep the app runnable at the end of each phase.

---

## 11. Spec-driven execution in Claude Code (how to run this build)

This document is the **spec**. To run it the spec-driven way, use a lean `CLAUDE.md` that points here, runnable gates per phase, and a fresh session per phase.

### 11.1 Repo layout for SDD
```
/CLAUDE.md            ← lean, always-loaded: rules + commands + pointers (provided separately)
/specs/
  build-plan.md       ← THIS document (the full spec)
  tasks.md            ← per-phase checklist the agent ticks off (§11.3)
/src/ …               ← the app
```
Keep `CLAUDE.md` short; it imports the spec with `@specs/build-plan.md`. Do **not** paste this whole document into `CLAUDE.md` — it would bloat every session's context.

### 11.2 Verification gates (the runnable check for each phase)
Every phase is "done" only when these pass. The agent must run them and show output, not assert success.

**Always-on gates (all phases):**
```bash
npx tsc --noEmit        # types compile
npm run build           # vite build succeeds
npm run lint            # eslint clean
npm run test            # vitest: pure-function unit tests pass
```

**Phase-specific unit tests (Vitest, pure functions only — cheap and high-leverage):**
- **Phase 0:** `canTransition()` allows only the §3 edges and blocks the rest; `requiresApproval()` true iff account requires + total ≥ threshold; seed loads N accounts/menus/orders with expected counts.
- **Phase 1:** `isMenuAvailableForDate()` correctly includes/excludes for lead-time, cut-off, day-of-week, and date window (table of cases); `validateMinimums()` flags under-min value/persons and out-of-range qty; `computeTotals()` sums lines correctly.
- **Phase 2:** state-machine path `submitted→confirmed→in_production→out_for_delivery→delivered→invoiced` each passes `canTransition` for the right role and fails for the wrong role; `generateInvoice()` carries PO + cost centre and produces matching totals.
- **Phase 3:** rejecting returns order to `draft` with note; editing an Item price does **not** mutate an existing order line's `unitPriceSnapshot` (the snapshot test — assert on a seeded historical order).
- **Phase 4 (if built):** a multi-slot order's by-item production aggregation equals the sum across slots.

**Manual smoke (operator confirms in browser after gates pass):** the persona-switch demo thread for that phase renders and is themed (Eden brand visible).

> Rationale: pure functions (`rules.ts`, `stateMachine.ts`) hold all the business logic and are trivial to test; testing them gives the agent a real pass/fail to iterate against without the cost of a UI test suite.

### 11.3 `tasks.md` format (agent maintains this)
Break each phase into checkable items with exact file paths; check in before coding; tick as you go.
```md
## Phase 1 — Customer ordering happy path
- [ ] src/features/customer/DatePicker.tsx — date select, writes draft.eventDate
- [ ] src/features/customer/MenuBrowse.tsx — uses menusForDate(); empty state
- [ ] src/features/customer/MenuDetail.tsx — qty stepper clamped to min/max
- [ ] src/lib/rules.test.ts — availability + minimums cases
- [ ] GATE: tsc + build + lint + test green; smoke: Emma submits a Sandwich Lunch
```

### 11.4 Recommended operating procedure (per phase)
1. **Plan mode first.** Open plan mode; have the agent read `@specs/build-plan.md` for that phase and produce/refine `tasks.md`. Approve before it writes code. (Planning is for multi-file work like this; skip it only for trivial fixes.)
2. **Fresh session per phase.** Start each phase in a clean context (`/clear` or a new session) so earlier file reads don't crowd the window. The spec is the durable memory, not the chat.
3. **Implement against the plan**, running the §11.2 gates and fixing until green; show evidence (test/build output).
4. **Adversarial review.** Use a subagent to review the phase diff against `build-plan.md`: "check every requirement is implemented and the snapshot/transition tests exist; report gaps that affect correctness or the stated requirements, not style."
5. **Commit per phase** with a descriptive message; keep the app runnable.

### 11.5 Slicing note (optional improvement)
For the earliest possible end-to-end proof, the agent may collapse the first vertical slice to: one menu → one single order → it appears on the back-office Calendar → Confirm. That tracer bullet crosses both modules before breadth is added in Phases 1–2, giving end-to-end feedback sooner. Acceptable but not required; the phase order above already front-loads the shared thread.