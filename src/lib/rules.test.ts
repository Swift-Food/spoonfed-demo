import { describe, expect, it } from 'vitest';
import { computeTotals, isMenuAvailableForDate, requiresApproval, validateMinimums } from './rules';
import type { Account, Item, Menu, Order, OrderLine } from './types';

const account: Account = {
  id: 'acc_sky',
  name: 'Sky Media',
  paymentTermsDays: 30,
  requiresApproval: true,
  approvalThreshold: 250,
  poRequired: true,
  costCentres: ['Marketing'],
  deliveryLocations: [{ building: 'Osterley Campus', room: 'Boardroom 1' }],
  active: true,
};

describe('requiresApproval', () => {
  it('is false when the account does not require approval, regardless of total', () => {
    expect(requiresApproval({ ...account, requiresApproval: false }, 10_000)).toBe(false);
  });

  it('is false when the total is below the threshold', () => {
    expect(requiresApproval(account, 249.99)).toBe(false);
  });

  it('is true when the total is exactly at the threshold', () => {
    expect(requiresApproval(account, 250)).toBe(true);
  });

  it('is true when the total is above the threshold', () => {
    expect(requiresApproval(account, 1000)).toBe(true);
  });
});

describe('computeTotals', () => {
  const lines: OrderLine[] = [
    { id: 'line_1', orderId: 'order_1', itemId: 'item_a', nameSnapshot: 'A', unitPriceSnapshot: 10, unit: 'each', qty: 2, lineTotal: 20, allergenSnapshot: [] },
    { id: 'line_2', orderId: 'order_1', itemId: 'item_b', nameSnapshot: 'B', unitPriceSnapshot: 5.5, unit: 'each', qty: 3, lineTotal: 16.5, allergenSnapshot: [] },
  ];

  it('sums line totals for the subtotal, with no delivery fee or tax by default', () => {
    expect(computeTotals(lines)).toEqual({ subtotal: 36.5, tax: 0, total: 36.5 });
  });

  it('adds delivery fee and tax on top of the subtotal', () => {
    expect(computeTotals(lines, 5, 0.2)).toEqual({ subtotal: 36.5, tax: 7.3, total: 48.8 });
  });
});

const menu: Menu = {
  id: 'menu_sandwich',
  name: 'Sandwich Lunch',
  description: 'Test menu',
  serviceType: 'single',
  availableFrom: '2026-01-01',
  availableTo: '2026-12-31',
  leadTimeHours: 24,
  cutoffTime: '10:00',
  availableDays: [1, 2, 3, 4, 5],
  minOrderValue: 60,
  minPersons: 5,
  active: true,
};

describe('isMenuAvailableForDate', () => {
  it('is available on a weekday within the availability window, before cutoff', () => {
    // Monday 2026-06-15; cutoff is 2026-06-14 10:00 (local time, like getOrderCutoff)
    const now = new Date('2026-06-13T09:00:00');
    expect(isMenuAvailableForDate(menu, '2026-06-15', now)).toBe(true);
  });

  it('is unavailable once the lead-time cutoff has passed', () => {
    const now = new Date('2026-06-14T11:00:00');
    expect(isMenuAvailableForDate(menu, '2026-06-15', now)).toBe(false);
  });

  it('is unavailable on a day of the week outside availableDays', () => {
    // Sunday 2026-06-14 is not in [1..5] (Mon-Fri)
    const now = new Date('2026-06-01T00:00:00Z');
    expect(isMenuAvailableForDate(menu, '2026-06-14', now)).toBe(false);
  });

  it('is unavailable when the menu is inactive or offline', () => {
    const now = new Date('2026-06-13T09:00:00Z');
    expect(isMenuAvailableForDate({ ...menu, active: false }, '2026-06-15', now)).toBe(false);
    expect(isMenuAvailableForDate({ ...menu, offline: true }, '2026-06-15', now)).toBe(false);
  });
});

const item: Item = {
  id: 'item_sandwich_platter',
  menuId: 'menu_sandwich',
  name: 'Seasonal Sandwich Platter',
  description: 'Test item',
  price: 28,
  unit: 'per_platter',
  minQty: 1,
  maxQty: 10,
  allergens: ['gluten', 'dairy'],
  dietary: [],
  portion: 'Serves 6',
  available: true,
};

const baseOrder: Order = {
  id: 'order_test',
  orderNumber: 'EDN-TEST',
  accountId: 'acc_sky',
  placedByContactId: 'con_emma',
  status: 'draft',
  isQuote: false,
  serviceType: 'single',
  eventDate: '2026-06-15',
  requestedDeliveryTime: '12:00',
  headcount: 6,
  deliveryLocation: { building: 'Osterley Campus', room: 'Boardroom 1' },
  requiresApproval: false,
  approvalStatus: 'n/a',
  slots: [],
  lines: [
    { id: 'line_1', orderId: 'order_test', itemId: 'item_sandwich_platter', nameSnapshot: 'Seasonal Sandwich Platter', unitPriceSnapshot: 28, unit: 'per_platter', qty: 3, lineTotal: 84, allergenSnapshot: ['gluten', 'dairy'] },
  ],
  subtotal: 84,
  deliveryFee: 0,
  tax: 0,
  total: 84,
  source: 'customer_portal',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  history: [],
};

describe('validateMinimums', () => {
  it('passes when subtotal, headcount and line quantities all meet the menu/item minimums', () => {
    expect(validateMinimums(baseOrder, menu, [item])).toEqual([]);
  });

  it('flags a subtotal below the menu minimum order value', () => {
    const order = { ...baseOrder, subtotal: 10 };
    expect(validateMinimums(order, menu, [item])).toEqual(
      expect.arrayContaining([expect.stringContaining('minimum')]),
    );
  });

  it('flags a headcount below the menu minimum persons', () => {
    const order = { ...baseOrder, headcount: 1 };
    const violations = validateMinimums(order, menu, [item]);
    expect(violations.some((v) => v.includes('minimum of 5 people'))).toBe(true);
  });

  it('flags a line quantity outside the item min/max', () => {
    const order = {
      ...baseOrder,
      lines: [{ ...baseOrder.lines[0], qty: 0 }],
    };
    const violations = validateMinimums(order, menu, [item]);
    expect(violations.some((v) => v.includes('Seasonal Sandwich Platter'))).toBe(true);
  });
});
