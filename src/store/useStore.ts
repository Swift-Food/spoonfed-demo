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
import { computeTotals, requiresApproval } from '../lib/rules';
import { round2 } from '../lib/money';

function nextOrderNumber(orders: Order[]): string {
  const max = orders.reduce((m, o) => {
    const n = Number(o.orderNumber.replace('EDN-', ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `EDN-${max + 1}`;
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
  startDraft: (params: { accountId: string; contactId: string; eventDate: string }) => void;
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
  createBackOfficeOrder: (payload: Partial<Order>) => void;
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
  startDraft: ({ accountId, contactId, eventDate }) =>
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
        source: 'customer_portal',
        createdAt: now,
        updatedAt: now,
        history: [{ at: now, actorRole: 'orderer', note: 'Draft started.' }],
      };
      return { draftOrder: draft };
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
  approveOrder: (_orderId, _note) => {
    // Implemented in Phase 3.
  },
  rejectOrder: (_orderId, _note) => {
    // Implemented in Phase 3.
  },

  // --- Back office (Phase 2) ---
  confirmOrder: (_orderId) => {
    // Implemented in Phase 2.
  },
  advanceStatus: (_orderId, _toStatus) => {
    // Implemented in Phase 2.
  },
  assignDriver: (_orderId, _driverId) => {
    // Implemented in Phase 2.
  },
  cancelOrder: (_orderId, _note) => {
    // Implemented in Phase 3.
  },
  createBackOfficeOrder: (_payload) => {
    // Implemented in Phase 3.
  },
  amendOrder: (_orderId, _patch) => {
    // Implemented in Phase 3.
  },

  // --- Menus (Phase 3) ---
  createMenu: (_menu) => {
    // Implemented in Phase 3.
  },
  updateMenu: (_menuId, _patch) => {
    // Implemented in Phase 3.
  },
  createItem: (_item) => {
    // Implemented in Phase 3.
  },
  updateItem: (_itemId, _patch) => {
    // Implemented in Phase 3.
  },

  // --- Invoices (Phase 2) ---
  generateInvoice: (_orderId) => {
    // Implemented in Phase 2.
  },
  markInvoiceSent: (_invoiceId) => {
    // Implemented in Phase 2.
  },
  markInvoicePaid: (_invoiceId) => {
    // Implemented in Phase 2.
  },

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
