import { addDays, format, subDays, subHours } from 'date-fns';
import type {
  Account,
  AppNotification,
  Contact,
  Invoice,
  Item,
  Menu,
  Order,
  OrderLine,
  Persona,
} from './types';
import { computeTotals } from './rules';

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKDAYS_PLUS_SAT = [1, 2, 3, 4, 5, 6];

const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');
const isoDateTime = (d: Date) => d.toISOString();

export const DEFAULT_PERSONA: Persona = { role: 'orderer', accountId: 'acc_sky', contactId: 'con_emma' };

export interface SeedData {
  accounts: Account[];
  contacts: Contact[];
  menus: Menu[];
  items: Item[];
  orders: Order[];
  invoices: Invoice[];
  notifications: AppNotification[];
}

export function createSeedData(): SeedData {
  const now = new Date();
  const availableFrom = isoDate(subDays(now, 30));
  const availableTo = isoDate(addDays(now, 90));

  const accounts: Account[] = [
    {
      id: 'acc_sky',
      name: 'Sky Media',
      paymentTermsDays: 30,
      requiresApproval: true,
      approvalThreshold: 250,
      poRequired: true,
      costCentres: ['Production', 'Events', 'Marketing'],
      deliveryLocations: [
        { building: 'Osterley Campus', room: 'Boardroom 1' },
        { building: 'Osterley Campus', room: 'Studio Mezz' },
      ],
      active: true,
    },
    {
      id: 'acc_rss',
      name: 'Royal Statistical Society',
      paymentTermsDays: 45,
      requiresApproval: false,
      approvalThreshold: 0,
      poRequired: true,
      costCentres: ['Events', 'Membership'],
      deliveryLocations: [{ building: 'Errol Street', room: 'Council Room' }],
      active: true,
    },
    {
      id: 'acc_9others',
      name: '9Others',
      paymentTermsDays: 14,
      requiresApproval: false,
      approvalThreshold: 0,
      poRequired: false,
      costCentres: ['G&A'],
      deliveryLocations: [{ building: 'Clerkenwell Studio', room: 'Event Space' }],
      active: true,
    },
  ];

  const contacts: Contact[] = [
    { id: 'con_emma', accountId: 'acc_sky', name: 'Emma Hart', email: 'emma.hart@skymedia.example', role: 'orderer' },
    { id: 'con_raj', accountId: 'acc_sky', name: 'Raj Patel', email: 'raj.patel@skymedia.example', role: 'approver' },
    { id: 'con_li', accountId: 'acc_rss', name: 'Li Wei', email: 'li.wei@rss.example', role: 'orderer' },
    { id: 'con_priya', accountId: 'acc_9others', name: 'Priya Shah', email: 'priya.shah@9others.example', role: 'orderer' },
    { id: 'con_sam', accountId: 'acc_eden', name: 'Sam Okafor', email: 'sam@edencaterers.london', role: 'caterer_admin' },
    { id: 'con_kim', accountId: 'acc_eden', name: 'Kim Nguyen', email: 'kim@edencaterers.london', role: 'kitchen' },
    { id: 'con_dan', accountId: 'acc_eden', name: 'Dan Murphy', email: 'dan@edencaterers.london', role: 'driver' },
  ];

  const menus: Menu[] = [
    {
      id: 'menu_sandwich',
      name: 'Sandwich Lunch',
      description: 'Seasonal sandwiches, wraps and salads for the working day, made with UK ingredients.',
      serviceType: 'single',
      availableFrom,
      availableTo,
      leadTimeHours: 24,
      cutoffTime: '10:00',
      availableDays: WEEKDAYS,
      minOrderValue: 60,
      minPersons: 5,
      active: true,
    },
    {
      id: 'menu_breakfast',
      name: 'Breakfast',
      description: 'A fresh start: bircher pots, seasonal fruit and free-range bakes.',
      serviceType: 'single',
      availableFrom,
      availableTo,
      leadTimeHours: 18,
      cutoffTime: '15:00',
      availableDays: WEEKDAYS,
      minOrderValue: 40,
      minPersons: 4,
      active: true,
    },
    {
      id: 'menu_forkbuffet',
      name: 'Fork Buffet & Salads',
      description: 'A generous spread for bigger gatherings — roast veg, grains and sustainably-sourced mains.',
      serviceType: 'single',
      availableFrom,
      availableTo,
      leadTimeHours: 48,
      cutoffTime: '12:00',
      availableDays: WEEKDAYS,
      minOrderValue: 200,
      minPersons: 10,
      active: true,
    },
    {
      id: 'menu_hotbowls',
      name: 'Hot Bowl Meals',
      description: 'Warming, veg-forward bowls for cooler days — perfect for working lunches.',
      serviceType: 'single',
      availableFrom,
      availableTo,
      leadTimeHours: 24,
      cutoffTime: '10:00',
      availableDays: WEEKDAYS,
      minOrderValue: 80,
      minPersons: 6,
      active: true,
    },
    {
      id: 'menu_afternoontea',
      name: 'Afternoon Tea',
      description: 'A refined spread of finger sandwiches, scones and seasonal bakes.',
      serviceType: 'single',
      availableFrom,
      availableTo,
      leadTimeHours: 48,
      cutoffTime: '12:00',
      availableDays: WEEKDAYS_PLUS_SAT,
      minOrderValue: 100,
      minPersons: 6,
      active: true,
    },
  ];

  const items: Item[] = [
    // Sandwich Lunch
    {
      id: 'item_sandwich_platter', menuId: 'menu_sandwich', name: 'Seasonal Sandwich Platter',
      description: 'A mix of our seasonal sandwich fillings on artisan bread.',
      price: 28, unit: 'per_platter', minQty: 1, maxQty: 10,
      allergens: ['gluten', 'dairy'], dietary: [], portion: 'Serves 6', available: true,
    },
    {
      id: 'item_vegan_wrap', menuId: 'menu_sandwich', name: 'Vegan Wrap Selection',
      description: 'Plant-based wraps packed with seasonal veg.',
      price: 26, unit: 'per_platter', minQty: 1, maxQty: 10,
      allergens: ['gluten'], dietary: ['vegan'], portion: 'Serves 6', available: true,
    },
    {
      id: 'item_tomato_salad', menuId: 'menu_sandwich', name: 'Heritage Tomato & Leaf Salad Bowl',
      description: 'Heritage tomatoes with seasonal leaves and a light dressing.',
      price: 6.5, unit: 'per_person', minQty: 5, maxQty: 100,
      allergens: [], dietary: ['vegetarian', 'gluten_free'], portion: 'Per person', available: true,
    },
    {
      id: 'item_fruit_platter', menuId: 'menu_sandwich', name: 'British Fruit Platter',
      description: 'A platter of fresh seasonal British fruit.',
      price: 18, unit: 'per_platter', minQty: 1, maxQty: 10,
      allergens: [], dietary: ['vegan', 'gluten_free'], portion: 'Serves 8', available: true,
    },
    {
      id: 'item_egg_cress', menuId: 'menu_sandwich', name: 'Free-range Egg & Cress Rounds',
      description: 'Classic free-range egg and cress on soft white bread.',
      price: 22, unit: 'per_platter', minQty: 1, maxQty: 10,
      allergens: ['gluten', 'egg', 'dairy'], dietary: ['vegetarian'], portion: 'Serves 6', available: true,
    },
    {
      id: 'item_water', menuId: 'menu_sandwich', name: 'Still & Sparkling Water',
      description: 'Chilled still and sparkling water, 330ml.',
      price: 1.5, unit: 'each', minQty: 1, maxQty: 200,
      allergens: [], dietary: ['vegan', 'vegetarian', 'gluten_free', 'halal'], portion: '330ml bottle', available: true,
    },
    // Breakfast
    {
      id: 'item_bircher', menuId: 'menu_breakfast', name: 'Bircher & Granola Pots',
      description: 'Overnight oats with seasonal fruit and toasted granola.',
      price: 4.5, unit: 'per_person', minQty: 4, maxQty: 200,
      allergens: ['gluten', 'nuts'], dietary: ['vegetarian'], portion: 'Per person', available: true,
    },
    {
      id: 'item_fruitbox', menuId: 'menu_breakfast', name: 'Seasonal Fruit Box',
      description: 'A box of fresh seasonal fruit, prepared and ready to share.',
      price: 3.75, unit: 'per_person', minQty: 4, maxQty: 200,
      allergens: [], dietary: ['vegan', 'vegetarian', 'gluten_free', 'halal'], portion: 'Per person', available: true,
    },
    {
      id: 'item_bacon_veggie_rolls', menuId: 'menu_breakfast', name: 'Bacon & Veggie Rolls',
      description: 'A mix of free-range bacon and veggie sausage rolls.',
      price: 4.25, unit: 'each', minQty: 4, maxQty: 200,
      allergens: ['gluten'], dietary: [], portion: 'Each (mixed)', available: true,
    },
    // Fork Buffet & Salads
    {
      id: 'item_roast_veg_grains', menuId: 'menu_forkbuffet', name: 'Roast Seasonal Veg & Grains',
      description: 'Roasted seasonal vegetables with ancient grains.',
      price: 9.5, unit: 'per_person', minQty: 10, maxQty: 300,
      allergens: [], dietary: ['vegan', 'gluten_free'], portion: 'Per person', available: true,
    },
    {
      id: 'item_salmon', menuId: 'menu_forkbuffet', name: 'Sustainably-sourced Salmon',
      description: 'Slow-roasted salmon from sustainable UK waters.',
      price: 12, unit: 'per_person', minQty: 10, maxQty: 300,
      allergens: ['fish'], dietary: [], portion: 'Per person', available: true,
    },
    {
      id: 'item_chicken_traybake', menuId: 'menu_forkbuffet', name: 'Free-range Chicken Traybake',
      description: 'Free-range chicken roasted with seasonal vegetables.',
      price: 11, unit: 'per_person', minQty: 10, maxQty: 300,
      allergens: [], dietary: ['gluten_free'], portion: 'Per person', available: true,
    },
    // Hot Bowl Meals
    {
      id: 'item_miso_bowl', menuId: 'menu_hotbowls', name: 'Miso Roasted Veg & Soba Noodle Bowl',
      description: 'Miso-glazed roasted vegetables with soba noodles.',
      price: 10.5, unit: 'per_person', minQty: 6, maxQty: 200,
      allergens: ['soy', 'gluten'], dietary: ['vegan'], portion: 'Per person', available: true,
    },
    {
      id: 'item_chicken_grain_bowl', menuId: 'menu_hotbowls', name: 'Free-range Chicken & Grain Bowl',
      description: 'Free-range chicken with seasonal grains and greens.',
      price: 11.5, unit: 'per_person', minQty: 6, maxQty: 200,
      allergens: [], dietary: ['gluten_free'], portion: 'Per person', available: true,
    },
    // Afternoon Tea
    {
      id: 'item_afternoon_tea_classic', menuId: 'menu_afternoontea', name: 'Classic Afternoon Tea Box',
      description: 'Finger sandwiches, scones and seasonal bakes.',
      price: 14, unit: 'per_person', minQty: 6, maxQty: 100,
      allergens: ['gluten', 'dairy', 'egg'], dietary: ['vegetarian'], portion: 'Per person', available: true,
    },
    {
      id: 'item_afternoon_tea_vegan', menuId: 'menu_afternoontea', name: 'Vegan Afternoon Tea Box',
      description: 'A plant-based afternoon tea with seasonal bakes.',
      price: 14, unit: 'per_person', minQty: 6, maxQty: 100,
      allergens: ['gluten'], dietary: ['vegan'], portion: 'Per person', available: true,
    },
  ];

  const itemById = (id: string): Item => {
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error(`Unknown seed item: ${id}`);
    return item;
  };

  let lineCounter = 0;
  const makeLine = (orderId: string, itemId: string, qty: number): OrderLine => {
    const item = itemById(itemId);
    lineCounter += 1;
    return {
      id: `line_${lineCounter}`,
      orderId,
      itemId: item.id,
      nameSnapshot: item.name,
      unitPriceSnapshot: item.price,
      unit: item.unit,
      qty,
      lineTotal: Math.round(item.price * qty * 100) / 100,
      allergenSnapshot: [...item.allergens],
    };
  };

  // EDN-1001 — draft (Sky, future date) — edit/cancel demo
  const order1001Lines = [
    makeLine('order_1001', 'item_sandwich_platter', 2),
    makeLine('order_1001', 'item_vegan_wrap', 1),
    makeLine('order_1001', 'item_water', 10),
  ];
  const order1001Totals = computeTotals(order1001Lines);
  const order1001CreatedAt = isoDateTime(subHours(now, 1));
  const order1001: Order = {
    id: 'order_1001',
    orderNumber: 'EDN-1001',
    accountId: 'acc_sky',
    placedByContactId: 'con_emma',
    status: 'draft',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(addDays(now, 14)),
    requestedDeliveryTime: '12:30',
    headcount: 12,
    deliveryLocation: { building: 'Osterley Campus', room: 'Boardroom 1' },
    deliveryInstructions: 'Please deliver to reception, ask for Emma.',
    poNumber: 'SKY-PO-1001',
    costCentre: 'Marketing',
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1001Lines,
    ...order1001Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    createdAt: order1001CreatedAt,
    updatedAt: order1001CreatedAt,
    history: [{ at: order1001CreatedAt, actorRole: 'orderer', note: 'Draft created by Emma Hart.' }],
  };

  // EDN-1002 — pending_approval (Sky, total > £250) — approvals queue
  const order1002Lines = [
    makeLine('order_1002', 'item_roast_veg_grains', 20),
    makeLine('order_1002', 'item_salmon', 10),
    makeLine('order_1002', 'item_chicken_traybake', 10),
  ];
  const order1002Totals = computeTotals(order1002Lines);
  const order1002CreatedAt = isoDateTime(subHours(now, 3));
  const order1002: Order = {
    id: 'order_1002',
    orderNumber: 'EDN-1002',
    accountId: 'acc_sky',
    placedByContactId: 'con_emma',
    status: 'pending_approval',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(addDays(now, 10)),
    requestedDeliveryTime: '12:00',
    headcount: 20,
    deliveryLocation: { building: 'Osterley Campus', room: 'Studio Mezz' },
    poNumber: 'SKY-PO-1002',
    costCentre: 'Events',
    requiresApproval: true,
    approvalStatus: 'pending',
    slots: [],
    lines: order1002Lines,
    ...order1002Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    createdAt: order1002CreatedAt,
    updatedAt: order1002CreatedAt,
    history: [
      { at: order1002CreatedAt, actorRole: 'orderer', note: 'Submitted by Emma Hart.' },
      { at: order1002CreatedAt, actorRole: 'caterer_admin', note: 'Routed to Raj Patel for approval — total exceeds Sky Media’s £250 threshold.' },
    ],
  };

  // EDN-1003 — confirmed, dated today (Sky) — Production + Delivery
  const order1003Lines = [
    makeLine('order_1003', 'item_sandwich_platter', 1),
    makeLine('order_1003', 'item_tomato_salad', 8),
    makeLine('order_1003', 'item_fruit_platter', 1),
  ];
  const order1003Totals = computeTotals(order1003Lines);
  const order1003PlacedAt = isoDateTime(subDays(now, 2));
  const order1003ConfirmedAt = isoDateTime(subDays(now, 1));
  const order1003: Order = {
    id: 'order_1003',
    orderNumber: 'EDN-1003',
    accountId: 'acc_sky',
    placedByContactId: 'con_emma',
    status: 'confirmed',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(now),
    requestedDeliveryTime: '12:30',
    headcount: 8,
    deliveryLocation: { building: 'Osterley Campus', room: 'Boardroom 1' },
    poNumber: 'SKY-PO-1003',
    costCentre: 'Marketing',
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1003Lines,
    ...order1003Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    createdAt: order1003PlacedAt,
    updatedAt: order1003ConfirmedAt,
    history: [
      { at: order1003PlacedAt, actorRole: 'orderer', note: 'Order placed by Emma Hart.' },
      { at: order1003ConfirmedAt, actorRole: 'caterer_admin', note: 'Order confirmed by Sam Okafor.' },
    ],
  };

  // EDN-1004 — confirmed, dated today (RSS) — Production + Delivery
  const order1004Lines = [
    makeLine('order_1004', 'item_bircher', 10),
    makeLine('order_1004', 'item_fruitbox', 10),
    makeLine('order_1004', 'item_bacon_veggie_rolls', 10),
  ];
  const order1004Totals = computeTotals(order1004Lines);
  const order1004PlacedAt = isoDateTime(subDays(now, 3));
  const order1004ConfirmedAt = isoDateTime(subDays(now, 2));
  const order1004: Order = {
    id: 'order_1004',
    orderNumber: 'EDN-1004',
    accountId: 'acc_rss',
    placedByContactId: 'con_li',
    status: 'confirmed',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(now),
    requestedDeliveryTime: '08:30',
    headcount: 10,
    deliveryLocation: { building: 'Errol Street', room: 'Council Room' },
    poNumber: 'RSS-PO-2001',
    costCentre: 'Events',
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1004Lines,
    ...order1004Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    createdAt: order1004PlacedAt,
    updatedAt: order1004ConfirmedAt,
    history: [
      { at: order1004PlacedAt, actorRole: 'orderer', note: 'Order placed by Li Wei.' },
      { at: order1004ConfirmedAt, actorRole: 'caterer_admin', note: 'Order confirmed by Sam Okafor.' },
    ],
  };

  // EDN-1005 — delivered, not yet invoiced (9Others) — Billing demo
  const order1005Lines = [
    makeLine('order_1005', 'item_vegan_wrap', 3),
    makeLine('order_1005', 'item_fruit_platter', 2),
  ];
  const order1005Totals = computeTotals(order1005Lines);
  const order1005PlacedAt = isoDateTime(subDays(now, 7));
  const order1005ConfirmedAt = isoDateTime(subDays(now, 6));
  const order1005ProductionAt = isoDateTime(subDays(now, 4));
  const order1005DispatchedAt = isoDateTime(subHours(subDays(now, 3), 4));
  const order1005DeliveredAt = isoDateTime(subDays(now, 3));
  const order1005: Order = {
    id: 'order_1005',
    orderNumber: 'EDN-1005',
    accountId: 'acc_9others',
    placedByContactId: 'con_priya',
    status: 'delivered',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(subDays(now, 3)),
    requestedDeliveryTime: '12:00',
    headcount: 12,
    deliveryLocation: { building: 'Clerkenwell Studio', room: 'Event Space' },
    costCentre: 'G&A',
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1005Lines,
    ...order1005Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    driverId: 'con_dan',
    createdAt: order1005PlacedAt,
    updatedAt: order1005DeliveredAt,
    history: [
      { at: order1005PlacedAt, actorRole: 'orderer', note: 'Order placed by Priya Shah.' },
      { at: order1005ConfirmedAt, actorRole: 'caterer_admin', note: 'Order confirmed by Sam Okafor.' },
      { at: order1005ProductionAt, actorRole: 'kitchen', note: 'Production started by Kim Nguyen.' },
      { at: order1005DispatchedAt, actorRole: 'driver', note: 'Out for delivery with Dan Murphy.' },
      { at: order1005DeliveredAt, actorRole: 'driver', note: 'Delivered by Dan Murphy.' },
    ],
  };

  // EDN-1006 — invoiced (RSS) — completed thread
  const order1006Lines = [
    makeLine('order_1006', 'item_roast_veg_grains', 15),
    makeLine('order_1006', 'item_chicken_traybake', 15),
  ];
  const order1006Totals = computeTotals(order1006Lines);
  const order1006PlacedAt = isoDateTime(subDays(now, 14));
  const order1006ConfirmedAt = isoDateTime(subDays(now, 13));
  const order1006ProductionAt = isoDateTime(subDays(now, 11));
  const order1006DispatchedAt = isoDateTime(subHours(subDays(now, 10), 4));
  const order1006DeliveredAt = isoDateTime(subDays(now, 10));
  const order1006InvoicedAt = isoDateTime(subDays(now, 9));
  const order1006: Order = {
    id: 'order_1006',
    orderNumber: 'EDN-1006',
    accountId: 'acc_rss',
    placedByContactId: 'con_li',
    status: 'invoiced',
    isQuote: false,
    serviceType: 'single',
    eventDate: isoDate(subDays(now, 10)),
    requestedDeliveryTime: '12:00',
    headcount: 15,
    deliveryLocation: { building: 'Errol Street', room: 'Council Room' },
    poNumber: 'RSS-PO-1999',
    costCentre: 'Membership',
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1006Lines,
    ...order1006Totals,
    deliveryFee: 0,
    source: 'customer_portal',
    driverId: 'con_dan',
    createdAt: order1006PlacedAt,
    updatedAt: order1006InvoicedAt,
    history: [
      { at: order1006PlacedAt, actorRole: 'orderer', note: 'Order placed by Li Wei.' },
      { at: order1006ConfirmedAt, actorRole: 'caterer_admin', note: 'Order confirmed by Sam Okafor.' },
      { at: order1006ProductionAt, actorRole: 'kitchen', note: 'Production started by Kim Nguyen.' },
      { at: order1006DispatchedAt, actorRole: 'driver', note: 'Out for delivery with Dan Murphy.' },
      { at: order1006DeliveredAt, actorRole: 'driver', note: 'Delivered by Dan Murphy.' },
      { at: order1006InvoicedAt, actorRole: 'caterer_admin', note: 'Invoice INV-1006 generated by Sam Okafor.' },
    ],
  };

  // EDN-1007 — quote (Sky)
  const order1007Lines = [
    makeLine('order_1007', 'item_roast_veg_grains', 30),
    makeLine('order_1007', 'item_salmon', 15),
    makeLine('order_1007', 'item_chicken_traybake', 15),
  ];
  const order1007Totals = computeTotals(order1007Lines);
  const order1007CreatedAt = isoDateTime(subHours(now, 6));
  const order1007: Order = {
    id: 'order_1007',
    orderNumber: 'EDN-1007',
    accountId: 'acc_sky',
    placedByContactId: 'con_emma',
    status: 'draft',
    isQuote: true,
    serviceType: 'single',
    eventDate: isoDate(addDays(now, 30)),
    requestedDeliveryTime: '12:00',
    headcount: 30,
    deliveryLocation: { building: 'Osterley Campus', room: 'Studio Mezz' },
    costCentre: 'Events',
    requiresApproval: order1007Totals.total >= 250,
    approvalStatus: 'n/a',
    slots: [],
    lines: order1007Lines,
    ...order1007Totals,
    deliveryFee: 0,
    source: 'back_office',
    createdAt: order1007CreatedAt,
    updatedAt: order1007CreatedAt,
    history: [{ at: order1007CreatedAt, actorRole: 'caterer_admin', note: 'Quote drafted by Sam Okafor for a Fork Buffet for 30.' }],
  };

  const orders: Order[] = [order1001, order1002, order1003, order1004, order1005, order1006, order1007];

  const invoices: Invoice[] = [
    {
      id: 'inv_1006',
      invoiceNumber: 'INV-1006',
      orderId: 'order_1006',
      accountId: 'acc_rss',
      status: 'sent',
      issueDate: isoDate(subDays(now, 9)),
      dueDate: isoDate(addDays(subDays(now, 9), 45)),
      poNumber: 'RSS-PO-1999',
      costCentre: 'Membership',
      lines: order1006Lines.map((l) => ({ name: l.nameSnapshot, qty: l.qty, unitPrice: l.unitPriceSnapshot, total: l.lineTotal })),
      subtotal: order1006Totals.subtotal,
      tax: order1006Totals.tax,
      total: order1006Totals.total,
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif_1', type: 'approval_requested', orderId: 'order_1002', recipientRole: 'approver',
      message: 'Order EDN-1002 from Emma Hart needs your approval.', createdAt: order1002CreatedAt, read: false,
    },
    {
      id: 'notif_2', type: 'order_received', orderId: 'order_1003', recipientRole: 'caterer_admin',
      message: 'New order EDN-1003 received from Sky Media.', createdAt: order1003PlacedAt, read: true,
    },
    {
      id: 'notif_3', type: 'invoice_sent', orderId: 'order_1006', recipientRole: 'orderer',
      message: 'Invoice INV-1006 has been sent for order EDN-1006.', createdAt: order1006InvoicedAt, read: true,
    },
  ];

  return { accounts, contacts, menus, items, orders, invoices, notifications };
}
