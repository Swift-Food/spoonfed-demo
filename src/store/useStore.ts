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
  OrderSlot,
  OrderStatus,
  Persona,
  Role,
} from '../lib/types';
import { createSeedData, DEFAULT_PERSONA } from '../lib/seed';

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
  startDraft: (_params) => {
    // Implemented in Phase 1.
  },
  addLine: (_itemId, _qty, _slotId) => {
    // Implemented in Phase 1.
  },
  updateLineQty: (_lineId, _qty) => {
    // Implemented in Phase 1.
  },
  removeLine: (_lineId) => {
    // Implemented in Phase 1.
  },
  setDraftField: (_patch) => {
    // Implemented in Phase 1.
  },
  addSlot: (_slot) => {
    // Implemented in Phase 4.
  },
  removeSlot: (_slotId) => {
    // Implemented in Phase 4.
  },
  submitDraft: () => {
    // Implemented in Phase 1.
  },

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
