import { nanoid } from 'nanoid';
import { create } from 'zustand';
import type {
  Account,
  AppNotification,
  Contact,
  Invoice,
  Item,
  Menu,
  NotificationType,
  Order,
  OrderLine,
  OrderSlot,
  OrderStatus,
  Persona,
  Role,
} from '../lib/types';
import { createSeedData, DEFAULT_PERSONA } from '../lib/seed';
import { buildInvoice, canCancelOrder, computeTotals, getOrderMenu, requiresApproval } from '../lib/rules';
import { canTransition, STATUS_LABELS } from '../lib/stateMachine';
import { round2 } from '../lib/money';

function nextOrderNumber(orders: Order[]): string {
  const max = orders.reduce((m, o) => {
    const n = Number(o.orderNumber.replace('EDN-', ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `EDN-${max + 1}`;
}

function contactName(contacts: Contact[], contactId?: string): string {
  return contacts.find((c) => c.id === contactId)?.name ?? 'Eden Caterers';
}

interface AppState {
  accounts: Account[];
  contacts: Contact[];
  menus: Menu[];
  items: Item[];
  orders: Order[];
  invoices: Invoice[];
  notifications: AppNotification[];
  persona: Persona;
  draftOrder: Order | null;

  // persona
  setPersona: (persona: Persona) => void;

  // customer ordering
  startDraft: (params: { accountId: string; contactId: string; eventDate: string; source?: Order['source'] }) => void;
  startEdit: (orderId: string) => void;
  addLine: (itemId: string, qty: number, slotId?: string) => void;
  updateLineQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  setDraftField: (patch: Partial<Order>) => void;
  addSlot: (slot: OrderSlot) => void;
  removeSlot: (slotId: string) => void;
  submitDraft: () => void;

  // approval
  approveOrder: (orderId: string, note?: string) => void;
  rejectOrder: (orderId: string, note?: string) => void;

  // back office
  confirmOrder: (orderId: string) => void;
  advanceStatus: (orderId: string, toStatus: OrderStatus) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  cancelOrder: (orderId: string, note?: string) => void;
  createBackOfficeOrder: () => void;
  amendOrder: (orderId: string, patch: Partial<Order>) => void;

  // menus
  createMenu: (menu: Omit<Menu, 'id'>) => void;
  updateMenu: (menuId: string, patch: Partial<Menu>) => void;
  createItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (itemId: string, patch: Partial<Item>) => void;

  // invoices
  generateInvoice: (orderId: string) => void;
  markInvoiceSent: (invoiceId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;

  // notifications
  pushNotification: (notification: { type: NotificationType; orderId: string; recipientRole: Role; message: string }) => void;
  markRead: (notificationId: string) => void;

  // demo
  resetDemo: () => void;
}

export const useStore = create<AppState>()((set) => ({
  ...createSeedData(),
  persona: DEFAULT_PERSONA,
  draftOrder: null,

  setPersona: (persona) => set({ persona }),

  // --- Customer ordering (Phase 1) ---
  startDraft: ({ accountId, contactId, eventDate, source = 'customer_portal' }) =>
    set(() => {
      const now = new Date().toISOString();
      const draft: Order = {
        id: nanoid(),
        orderNumber: '',
        accountId,
        placedByContactId: contactId,
        status: 'draft',
        isQuote: false,
        serviceType: 'single',
        eventDate,
        requestedDeliveryTime: '12:00',
        headcount: 0,
        deliveryLocation: { building: '', room: '' },
        requiresApproval: false,
        approvalStatus: 'n/a',
        slots: [],
        lines: [],
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
        source,
        createdAt: now,
        updatedAt: now,
        history: [{ at: now, actorRole: 'orderer', note: 'Draft started.' }],
      };
      return { draftOrder: draft };
    }),

  startEdit: (orderId) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return {};
      return { draftOrder: { ...order, lines: order.lines.map((l) => ({ ...l })) } };
    }),

  addLine: (itemId, qty, slotId) =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return {};

      const existing = draft.lines.find((l) => l.itemId === itemId && l.slotId === slotId);
      let lines: OrderLine[];
      if (existing) {
        const newQty = Math.min(Math.max(existing.qty + qty, item.minQty), item.maxQty);
        lines = draft.lines.map((l) =>
          l.id === existing.id ? { ...l, qty: newQty, lineTotal: round2(item.price * newQty) } : l,
        );
      } else {
        const newQty = Math.min(Math.max(qty, item.minQty), item.maxQty);
        const newLine: OrderLine = {
          id: nanoid(),
          orderId: draft.id,
          slotId,
          itemId: item.id,
          nameSnapshot: item.name,
          unitPriceSnapshot: item.price,
          unit: item.unit,
          qty: newQty,
          lineTotal: round2(item.price * newQty),
          allergenSnapshot: [...item.allergens],
        };
        lines = [...draft.lines, newLine];
      }

      const headcount =
        draft.lines.length === 0 && draft.headcount === 0
          ? state.menus.find((m) => m.id === item.menuId)?.minPersons ?? draft.headcount
          : draft.headcount;

      const totals = computeTotals(lines, draft.deliveryFee, 0);
      return { draftOrder: { ...draft, lines, headcount, ...totals, updatedAt: new Date().toISOString() } };
    }),

  updateLineQty: (lineId, qty) =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};
      const lines = draft.lines.map((l) => {
        if (l.id !== lineId) return l;
        const item = state.items.find((i) => i.id === l.itemId);
        const clamped = item ? Math.min(Math.max(qty, item.minQty), item.maxQty) : qty;
        return { ...l, qty: clamped, lineTotal: round2(l.unitPriceSnapshot * clamped) };
      });
      const totals = computeTotals(lines, draft.deliveryFee, 0);
      return { draftOrder: { ...draft, lines, ...totals, updatedAt: new Date().toISOString() } };
    }),

  removeLine: (lineId) =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};
      const lines = draft.lines.filter((l) => l.id !== lineId);
      const totals = computeTotals(lines, draft.deliveryFee, 0);
      return { draftOrder: { ...draft, lines, ...totals, updatedAt: new Date().toISOString() } };
    }),

  setDraftField: (patch) =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};
      // Changing the event date invalidates any cart lines drawn from the
      // previous date's menu — clear them rather than leave a stale,
      // possibly-unavailable menu attached to the new date.
      const clearsCart =
        patch.eventDate !== undefined && patch.eventDate !== draft.eventDate && draft.lines.length > 0;
      return {
        draftOrder: {
          ...draft,
          ...patch,
          ...(clearsCart ? { lines: [], headcount: 0, subtotal: 0, tax: 0, total: 0 } : {}),
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  addSlot: (_slot) => {
    // Implemented in Phase 4.
  },
  removeSlot: (_slotId) => {
    // Implemented in Phase 4.
  },

  submitDraft: () =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};

      const account = state.accounts.find((a) => a.id === draft.accountId);
      const contact = state.contacts.find((c) => c.id === draft.placedByContactId);
      const contactName = contact?.name ?? 'the customer';
      const needsApproval = account ? requiresApproval(account, draft.total) : false;
      const now = new Date().toISOString();
      const orderNumber = nextOrderNumber(state.orders);
      const status: OrderStatus = needsApproval ? 'pending_approval' : 'submitted';
      const historyNote = needsApproval
        ? `Submitted by ${contactName} — routed for approval (total exceeds ${account?.name ?? 'the account'}'s approval threshold).`
        : `Submitted by ${contactName}.`;

      const submitted: Order = {
        ...draft,
        orderNumber,
        status,
        requiresApproval: needsApproval,
        approvalStatus: needsApproval ? 'pending' : 'n/a',
        updatedAt: now,
        history: [...draft.history, { at: now, actorRole: 'orderer', note: historyNote }],
      };

      const notification: AppNotification = needsApproval
        ? {
            id: nanoid(),
            type: 'approval_requested',
            orderId: submitted.id,
            recipientRole: 'approver',
            message: `Order ${orderNumber} from ${contactName} needs your approval.`,
            createdAt: now,
            read: false,
          }
        : {
            id: nanoid(),
            type: 'order_received',
            orderId: submitted.id,
            recipientRole: 'caterer_admin',
            message: `New order ${orderNumber} received from ${account?.name ?? 'a customer'}.`,
            createdAt: now,
            read: false,
          };

      return {
        orders: [...state.orders, submitted],
        draftOrder: null,
        notifications: [...state.notifications, notification],
      };
    }),

  // --- Approval (Phase 3) ---
  approveOrder: (orderId, note) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !canTransition(order, 'submitted', state.persona.role)) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const account = state.accounts.find((a) => a.id === order.accountId);
      const updated: Order = {
        ...order,
        status: 'submitted',
        approvalStatus: 'approved',
        approverId: state.persona.contactId,
        approvalNote: note,
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Approved by ${actor}.${note ? ` ${note}` : ''}` }],
      };

      const approvedNotification: AppNotification = {
        id: nanoid(),
        type: 'approved',
        orderId,
        recipientRole: 'orderer',
        message: `Good news — order ${order.orderNumber} has been approved by ${actor}.`,
        createdAt: now,
        read: false,
      };
      const receivedNotification: AppNotification = {
        id: nanoid(),
        type: 'order_received',
        orderId,
        recipientRole: 'caterer_admin',
        message: `New order ${order.orderNumber} received from ${account?.name ?? 'a customer'}.`,
        createdAt: now,
        read: false,
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        notifications: [...state.notifications, approvedNotification, receivedNotification],
      };
    }),

  rejectOrder: (orderId, note) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !canTransition(order, 'draft', state.persona.role)) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const updated: Order = {
        ...order,
        status: 'draft',
        approvalStatus: 'rejected',
        approverId: state.persona.contactId,
        approvalNote: note,
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Rejected by ${actor}: ${note ?? ''}` }],
      };

      const notification: AppNotification = {
        id: nanoid(),
        type: 'rejected',
        orderId,
        recipientRole: 'orderer',
        message: `Order ${order.orderNumber} was not approved: ${note ?? ''}`,
        createdAt: now,
        read: false,
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        notifications: [...state.notifications, notification],
      };
    }),

  // --- Back office (Phase 2) ---
  confirmOrder: (orderId) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !canTransition(order, 'confirmed', state.persona.role)) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const updated: Order = {
        ...order,
        status: 'confirmed',
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Order confirmed by ${actor}.` }],
      };
      const notification: AppNotification = {
        id: nanoid(),
        type: 'confirmed',
        orderId,
        recipientRole: 'orderer',
        message: `Eden's got it — order ${order.orderNumber} is confirmed.`,
        createdAt: now,
        read: false,
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        notifications: [...state.notifications, notification],
      };
    }),

  advanceStatus: (orderId, toStatus) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !canTransition(order, toStatus, state.persona.role)) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      let note: string;
      let notification: AppNotification | undefined;

      switch (toStatus) {
        case 'in_production':
          note = `Production started by ${actor}.`;
          break;
        case 'out_for_delivery': {
          const driver = order.driverId ? state.contacts.find((c) => c.id === order.driverId) : undefined;
          note = driver ? `Out for delivery with ${driver.name}.` : `Order dispatched by ${actor}.`;
          notification = {
            id: nanoid(),
            type: 'out_for_delivery',
            orderId,
            recipientRole: 'orderer',
            message: `Order ${order.orderNumber} is out for delivery.`,
            createdAt: now,
            read: false,
          };
          break;
        }
        case 'delivered':
          note = `Delivered by ${actor}.`;
          notification = {
            id: nanoid(),
            type: 'delivered',
            orderId,
            recipientRole: 'orderer',
            message: `Order ${order.orderNumber} has been delivered.`,
            createdAt: now,
            read: false,
          };
          break;
        default:
          note = `Status updated to ${STATUS_LABELS[toStatus]} by ${actor}.`;
      }

      const updated: Order = {
        ...order,
        status: toStatus,
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note }],
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        ...(notification ? { notifications: [...state.notifications, notification] } : {}),
      };
    }),

  assignDriver: (orderId, driverId) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return {};

      const now = new Date().toISOString();
      const driver = state.contacts.find((c) => c.id === driverId);
      const updated: Order = {
        ...order,
        driverId,
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Driver assigned: ${driver?.name ?? driverId}.` }],
      };

      return { orders: state.orders.map((o) => (o.id === orderId ? updated : o)) };
    }),

  cancelOrder: (orderId, note) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return {};
      const menu = getOrderMenu(order, state.items, state.menus);
      if (!menu || !canCancelOrder(order, menu, new Date())) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const updated: Order = {
        ...order,
        status: 'cancelled',
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Order cancelled by ${actor}.${note ? ` ${note}` : ''}` }],
      };

      return { orders: state.orders.map((o) => (o.id === orderId ? updated : o)) };
    }),

  createBackOfficeOrder: () =>
    set((state) => {
      const draft = state.draftOrder;
      if (!draft) return {};

      const account = state.accounts.find((a) => a.id === draft.accountId);
      const contact = state.contacts.find((c) => c.id === draft.placedByContactId);
      const actor = contactName(state.contacts, state.persona.contactId);
      const needsApproval = account ? requiresApproval(account, draft.total) : false;
      const now = new Date().toISOString();
      const orderNumber = nextOrderNumber(state.orders);
      const status: OrderStatus = needsApproval ? 'pending_approval' : 'confirmed';

      const created: Order = {
        ...draft,
        orderNumber,
        status,
        source: 'back_office',
        requiresApproval: needsApproval,
        approvalStatus: needsApproval ? 'pending' : 'n/a',
        updatedAt: now,
        history: [
          ...draft.history,
          { at: now, actorRole: state.persona.role, note: `Order created on behalf of ${contact?.name ?? 'the customer'} by ${actor}.` },
        ],
      };

      const notification: AppNotification = needsApproval
        ? {
            id: nanoid(),
            type: 'approval_requested',
            orderId: created.id,
            recipientRole: 'approver',
            message: `Order ${orderNumber} for ${contact?.name ?? 'a customer'} needs your approval.`,
            createdAt: now,
            read: false,
          }
        : {
            id: nanoid(),
            type: 'confirmed',
            orderId: created.id,
            recipientRole: 'orderer',
            message: `Eden's got it — order ${orderNumber} is confirmed.`,
            createdAt: now,
            read: false,
          };

      return {
        orders: [...state.orders, created],
        draftOrder: null,
        notifications: [...state.notifications, notification],
      };
    }),

  amendOrder: (orderId, patch) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return {};

      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const updated: Order = {
        ...order,
        ...patch,
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Order amended by ${actor}.` }],
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        draftOrder: null,
      };
    }),

  // --- Menus (Phase 3) ---
  createMenu: (menu) =>
    set((state) => ({ menus: [...state.menus, { ...menu, id: nanoid() }] })),

  updateMenu: (menuId, patch) =>
    set((state) => ({
      menus: state.menus.map((m) => (m.id === menuId ? { ...m, ...patch } : m)),
    })),

  createItem: (item) =>
    set((state) => ({ items: [...state.items, { ...item, id: nanoid() }] })),

  updateItem: (itemId, patch) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    })),

  // --- Invoices (Phase 2) ---
  generateInvoice: (orderId) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      const account = order && state.accounts.find((a) => a.id === order.accountId);
      if (!order || !account || !canTransition(order, 'invoiced', state.persona.role)) return {};

      const nowDate = new Date();
      const now = nowDate.toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const invoice: Invoice = { id: nanoid(), ...buildInvoice(order, account, nowDate) };

      const updated: Order = {
        ...order,
        status: 'invoiced',
        updatedAt: now,
        history: [...order.history, { at: now, actorRole: state.persona.role, note: `Invoice ${invoice.invoiceNumber} generated by ${actor}.` }],
      };

      return {
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        invoices: [...state.invoices, invoice],
      };
    }),

  markInvoiceSent: (invoiceId) =>
    set((state) => {
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return {};

      const order = state.orders.find((o) => o.id === invoice.orderId);
      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);
      const notification: AppNotification = {
        id: nanoid(),
        type: 'invoice_sent',
        orderId: invoice.orderId,
        recipientRole: 'orderer',
        message: `Invoice ${invoice.invoiceNumber} has been sent for order ${order?.orderNumber ?? ''}.`,
        createdAt: now,
        read: false,
      };

      return {
        invoices: state.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'sent' } : i)),
        orders: order
          ? state.orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    updatedAt: now,
                    history: [...o.history, { at: now, actorRole: state.persona.role, note: `Invoice ${invoice.invoiceNumber} sent by ${actor}.` }],
                  }
                : o,
            )
          : state.orders,
        notifications: [...state.notifications, notification],
      };
    }),

  markInvoicePaid: (invoiceId) =>
    set((state) => {
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return {};

      const order = state.orders.find((o) => o.id === invoice.orderId);
      const now = new Date().toISOString();
      const actor = contactName(state.contacts, state.persona.contactId);

      return {
        invoices: state.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'paid' } : i)),
        orders: order
          ? state.orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    updatedAt: now,
                    history: [...o.history, { at: now, actorRole: state.persona.role, note: `Invoice ${invoice.invoiceNumber} marked as paid by ${actor}.` }],
                  }
                : o,
            )
          : state.orders,
      };
    }),

  // --- Notifications ---
  pushNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: nanoid(), createdAt: new Date().toISOString(), read: false },
      ],
    })),
  markRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    })),

  // --- Demo ---
  resetDemo: () => set({ ...createSeedData(), persona: DEFAULT_PERSONA, draftOrder: null }),
}));
