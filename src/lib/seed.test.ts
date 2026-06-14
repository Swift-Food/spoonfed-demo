import { describe, expect, it } from 'vitest';
import { createSeedData, DEFAULT_PERSONA } from './seed';

describe('createSeedData', () => {
  const seed = createSeedData();

  it('seeds the three Eden customer accounts', () => {
    expect(seed.accounts).toHaveLength(3);
    expect(seed.accounts.map((a) => a.id)).toEqual(['acc_sky', 'acc_rss', 'acc_9others']);
  });

  it('seeds contacts for every account plus Eden staff', () => {
    expect(seed.contacts).toHaveLength(7);
    for (const order of seed.orders) {
      expect(seed.contacts.some((c) => c.id === order.placedByContactId)).toBe(true);
    }
  });

  it('seeds five menus and sixteen items, each item belonging to a real menu', () => {
    expect(seed.menus).toHaveLength(5);
    expect(seed.items).toHaveLength(16);
    for (const item of seed.items) {
      expect(seed.menus.some((m) => m.id === item.menuId)).toBe(true);
    }
  });

  it('seeds orders covering the lifecycle: draft, pending_approval, confirmed, delivered, invoiced and a quote', () => {
    expect(seed.orders).toHaveLength(7);
    const statuses = seed.orders.map((o) => o.status);
    expect(statuses).toEqual(
      expect.arrayContaining(['draft', 'pending_approval', 'confirmed', 'delivered', 'invoiced']),
    );
    expect(seed.orders.some((o) => o.isQuote)).toBe(true);
  });

  it('computes order line totals and order totals from the seeded prices', () => {
    for (const order of seed.orders) {
      const expectedSubtotal = Math.round(order.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
      expect(order.subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(order.total).toBeCloseTo(order.subtotal + order.deliveryFee + order.tax, 2);
    }
  });

  it('seeds one invoice tied to the invoiced order', () => {
    expect(seed.invoices).toHaveLength(1);
    expect(seed.invoices[0].orderId).toBe('order_1006');
    const invoicedOrder = seed.orders.find((o) => o.id === 'order_1006');
    expect(invoicedOrder?.status).toBe('invoiced');
  });

  it('seeds notifications referencing real orders and recipient roles', () => {
    expect(seed.notifications).toHaveLength(3);
    for (const n of seed.notifications) {
      expect(seed.orders.some((o) => o.id === n.orderId)).toBe(true);
    }
  });

  it('points the default persona at a seeded account and contact', () => {
    expect(seed.accounts.some((a) => a.id === DEFAULT_PERSONA.accountId)).toBe(true);
    expect(seed.contacts.some((c) => c.id === DEFAULT_PERSONA.contactId)).toBe(true);
  });
});
