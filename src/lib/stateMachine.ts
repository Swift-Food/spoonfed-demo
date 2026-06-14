import type { Order, OrderStatus, Role } from './types';

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_approval', 'submitted', 'cancelled'],
  pending_approval: ['submitted', 'draft', 'cancelled'], // approve→submitted, reject→draft
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['invoiced'],
  invoiced: [],
  cancelled: [],
};

// who may move it
export const ROLE_TRANSITIONS: Partial<Record<OrderStatus, Role[]>> = {
  draft: ['orderer'],
  pending_approval: ['approver'],
  submitted: ['caterer_admin'],
  confirmed: ['caterer_admin', 'kitchen'],
  in_production: ['caterer_admin', 'kitchen', 'driver'],
  out_for_delivery: ['driver', 'caterer_admin'],
  delivered: ['caterer_admin'],
};

export function canTransition(order: Order, to: OrderStatus, role: Role): boolean {
  return (
    TRANSITIONS[order.status].includes(to) &&
    (ROLE_TRANSITIONS[order.status]?.includes(role) ?? false)
  );
}

// Customer-facing status labels
export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Awaiting approval',
  submitted: 'Received',
  confirmed: 'Confirmed',
  in_production: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled',
};
