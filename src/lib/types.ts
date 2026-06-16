export type Role = 'orderer' | 'approver' | 'caterer_admin' | 'kitchen' | 'driver';

export type OrderStatus =
  | 'draft' | 'pending_approval' | 'submitted' | 'confirmed'
  | 'in_production' | 'out_for_delivery' | 'delivered' | 'invoiced' | 'cancelled';

export type ServiceType = 'single' | 'multi_slot';
export type Unit = 'per_person' | 'per_platter' | 'each';
export type Allergen = 'gluten' | 'dairy' | 'nuts' | 'egg' | 'soy' | 'shellfish' | 'fish';
export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten_free' | 'halal';

export interface DeliveryLocation {
  building: string;
  room: string;
}

export interface Account {
  id: string;
  name: string;
  paymentTermsDays: number;
  requiresApproval: boolean; // if true, threshold applies
  approvalThreshold: number; // orders >= this need approval
  poRequired: boolean;
  costCentres: string[];
  deliveryLocations: DeliveryLocation[];
  active: boolean;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Item {
  id: string;
  menuId: string;
  name: string;
  description: string;
  price: number;
  unit: Unit;
  minQty: number;
  maxQty: number;
  allergens: Allergen[];
  dietary: DietaryTag[];
  portion: string;
  imageUrl?: string;
  available: boolean;
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  serviceType: ServiceType;
  availableFrom: string; // ISO date
  availableTo: string; // ISO date
  leadTimeHours: number; // min hours before eventDate
  cutoffTime: string; // 'HH:mm' on the day before/of, used with leadTime
  availableDays: number[]; // 0..6 (Sun..Sat)
  minOrderValue: number;
  minPersons: number;
  active: boolean;
  offline?: boolean; // quote-only, hidden from portal
}

export interface OrderSlot {
  id: string;
  label: string;
  serveTime: string; // 'HH:mm'
  locationOverride?: DeliveryLocation;
}

export interface OrderLine {
  id: string;
  orderId: string;
  slotId?: string;
  itemId: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  unit: Unit;
  qty: number;
  lineTotal: number;
  lineNotes?: string;
  allergenSnapshot: Allergen[];
}

export interface Order {
  id: string;
  orderNumber: string;
  accountId: string;
  placedByContactId: string;
  status: OrderStatus;
  isQuote: boolean;
  serviceType: ServiceType;
  eventDate: string; // ISO date
  requestedDeliveryTime: string; // 'HH:mm'
  headcount: number;
  deliveryLocation: DeliveryLocation;
  deliveryInstructions?: string;
  poNumber?: string;
  costCentre?: string;
  deptCode?: string;
  requiresApproval: boolean;
  approvalStatus: 'n/a' | 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approvalNote?: string;
  slots: OrderSlot[]; // empty for 'single'
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  source: 'customer_portal' | 'back_office';
  driverId?: string;
  createdAt: string;
  updatedAt: string;
  history: { at: string; actorRole: Role; note: string }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  accountId: string;
  status: 'draft' | 'sent' | 'paid';
  issueDate: string;
  dueDate: string;
  poNumber?: string;
  costCentre?: string;
  lines: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
}

export type NotificationType =
  | 'order_received' | 'approval_requested' | 'approved' | 'rejected'
  | 'confirmed' | 'out_for_delivery' | 'delivered' | 'invoice_sent';

export interface AppNotification {
  id: string;
  type: NotificationType;
  orderId: string;
  recipientRole: Role;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Persona {
  role: Role;
  accountId?: string;
  contactId?: string;
  /**
   * Orderer personas that drive the embedded Swift catering widget on `/order`
   * instead of Eden's in-house ordering flow (DatePicker → menus → cart).
   */
  useWidget?: boolean;
  /** For widget orderers: enable the widget's AI chat panel. */
  aiEnabled?: boolean;
}
