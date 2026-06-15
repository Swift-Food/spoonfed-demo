import { describe, expect, it } from 'vitest';
import { canTransition, ROLE_TRANSITIONS, TRANSITIONS } from './stateMachine';
import type { Order, OrderStatus, Role } from './types';

function makeOrder(status: OrderStatus): Order {
  return {
    id: 'order_test',
    orderNumber: 'EDN-TEST',
    accountId: 'acc_sky',
    placedByContactId: 'con_emma',
    status,
    isQuote: false,
    serviceType: 'single',
    eventDate: '2026-01-01',
    requestedDeliveryTime: '12:00',
    headcount: 10,
    deliveryLocation: { building: 'Test Building', room: 'Room 1' },
    requiresApproval: false,
    approvalStatus: 'n/a',
    slots: [],
    lines: [],
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0,
    source: 'customer_portal',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    history: [],
  };
}

const ALL_STATUSES = Object.keys(TRANSITIONS) as OrderStatus[];
const ALL_ROLES: Role[] = ['orderer', 'approver', 'caterer_admin', 'kitchen', 'driver'];

describe('canTransition', () => {
  it('allows the orderer to move a draft to pending_approval', () => {
    expect(canTransition(makeOrder('draft'), 'pending_approval', 'orderer')).toBe(true);
  });

  it('allows the orderer to submit a draft directly', () => {
    expect(canTransition(makeOrder('draft'), 'submitted', 'orderer')).toBe(true);
  });

  it('allows the approver to approve (submit) or reject (back to draft) a pending order', () => {
    expect(canTransition(makeOrder('pending_approval'), 'submitted', 'approver')).toBe(true);
    expect(canTransition(makeOrder('pending_approval'), 'draft', 'approver')).toBe(true);
  });

  it('does not allow an orderer to act on a pending_approval order', () => {
    expect(canTransition(makeOrder('pending_approval'), 'submitted', 'orderer')).toBe(false);
  });

  it('only the approver may approve (pending_approval → submitted) or reject (pending_approval → draft)', () => {
    for (const role of ALL_ROLES) {
      expect(canTransition(makeOrder('pending_approval'), 'submitted', role)).toBe(role === 'approver');
      expect(canTransition(makeOrder('pending_approval'), 'draft', role)).toBe(role === 'approver');
    }
  });

  it('allows caterer_admin to confirm a submitted order', () => {
    expect(canTransition(makeOrder('submitted'), 'confirmed', 'caterer_admin')).toBe(true);
  });

  it('does not allow an orderer to confirm a submitted order', () => {
    expect(canTransition(makeOrder('submitted'), 'confirmed', 'orderer')).toBe(false);
  });

  it('allows kitchen to start production on a confirmed order', () => {
    expect(canTransition(makeOrder('confirmed'), 'in_production', 'kitchen')).toBe(true);
  });

  it('allows a driver to move production through delivery', () => {
    expect(canTransition(makeOrder('in_production'), 'out_for_delivery', 'driver')).toBe(true);
    expect(canTransition(makeOrder('out_for_delivery'), 'delivered', 'driver')).toBe(true);
  });

  it('allows caterer_admin to invoice a delivered order', () => {
    expect(canTransition(makeOrder('delivered'), 'invoiced', 'caterer_admin')).toBe(true);
  });

  it('blocks transitions that are not adjacent in the lifecycle', () => {
    expect(canTransition(makeOrder('draft'), 'confirmed', 'orderer')).toBe(false);
    expect(canTransition(makeOrder('confirmed'), 'delivered', 'caterer_admin')).toBe(false);
  });

  it('treats invoiced and cancelled as terminal states', () => {
    for (const role of ALL_ROLES) {
      for (const status of ALL_STATUSES) {
        expect(canTransition(makeOrder('invoiced'), status, role)).toBe(false);
        expect(canTransition(makeOrder('cancelled'), status, role)).toBe(false);
      }
    }
  });

  it('walks the full order lifecycle, passing canTransition only for the allowed role(s) at each step', () => {
    const LIFECYCLE_PATH: { from: OrderStatus; to: OrderStatus }[] = [
      { from: 'submitted', to: 'confirmed' },
      { from: 'confirmed', to: 'in_production' },
      { from: 'in_production', to: 'out_for_delivery' },
      { from: 'out_for_delivery', to: 'delivered' },
      { from: 'delivered', to: 'invoiced' },
    ];

    for (const { from, to } of LIFECYCLE_PATH) {
      const allowedRoles = ROLE_TRANSITIONS[from] ?? [];
      for (const role of ALL_ROLES) {
        expect(canTransition(makeOrder(from), to, role)).toBe(allowedRoles.includes(role));
      }
    }
  });
});
