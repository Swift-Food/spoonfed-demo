import { describe, expect, it } from 'vitest';
import {
  computeTotals,
  earliestAvailableDate,
  getOrderMenu,
  isMenuAvailableForDate,
  requiresApproval,
  validateMinimums,
} from './rules';
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

  it('is unavailable for an event date before the menu availability window opens', () => {
    // menu.availableFrom is 2026-01-01; 2025-12-31 is a Wednesday, well clear of cutoff
    const now = new Date('2025-12-29T09:00:00');
    expect(isMenuAvailableForDate(menu, '2025-12-31', now)).toBe(false);
  });

  it('is unavailable for an event date after the menu availability window closes', () => {
    // menu.availableTo is 2026-12-31; 2027-01-01 is a Friday, well clear of cutoff
    const now = new Date('2026-12-29T09:00:00');
    expect(isMenuAvailableForDate(menu, '2027-01-01', now)).toBe(false);
  });

  it('is available on the first day of the availability window', () => {
    // 2026-01-01 is a Thursday, within availableDays and clear of cutoff
    const now = new Date('2025-12-30T09:00:00');
    expect(isMenuAvailableForDate(menu, '2026-01-01', now)).toBe(true);
  });

  it('is available on the last day of the availability window', () => {
    // 2026-12-31 is a Thursday, within availableDays and clear of cutoff
    const now = new Date('2026-12-29T09:00:00');
    expect(isMenuAvailableForDate(menu, '2026-12-31', now)).toBe(true);
  });
});

describe('earliestAvailableDate', () => {
  it('returns tomorrow when ordering this morning, ahead of tomorrow\'s cutoff', () => {
    // Monday 2026-06-15 09:00: today is already past cutoff, but tomorrow's
    // cutoff (today 10:00) hasn't passed yet.
    const now = new Date('2026-06-15T09:00:00');
    expect(earliestAvailableDate([menu], now)).toBe('2026-06-16');
  });

  it('skips to the day after tomorrow once today\'s cutoff has passed', () => {
    // Monday 2026-06-15 11:00: tomorrow's cutoff (today 10:00) has passed.
    const now = new Date('2026-06-15T11:00:00');
    expect(earliestAvailableDate([menu], now)).toBe('2026-06-17');
  });

  it('skips weekends to the next available weekday', () => {
    // Friday 2026-06-19 11:00: Sat/Sun are outside availableDays, so the
    // earliest valid date is the following Monday.
    const now = new Date('2026-06-19T11:00:00');
    expect(earliestAvailableDate([menu], now)).toBe('2026-06-22');
  });

  it('returns undefined when no menu is ever available within the horizon', () => {
    const now = new Date('2026-06-15T09:00:00');
    expect(earliestAvailableDate([{ ...menu, active: false }], now, 7)).toBeUndefined();
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

describe('getOrderMenu', () => {
  it('returns the menu for the item on the order\'s first line', () => {
    expect(getOrderMenu(baseOrder, [item], [menu])).toEqual(menu);
  });

  it('returns undefined for an order with no lines', () => {
    expect(getOrderMenu({ ...baseOrder, lines: [] }, [item], [menu])).toBeUndefined();
  });
});

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
