import { parseISO, getDay, startOfDay, endOfDay } from 'date-fns';
import type { Account, Item, Menu, Order, OrderLine, OrderStatus } from './types';
import { getOrderCutoff } from './dates';
import { formatMoney, round2 } from './money';

export function isMenuAvailableForDate(menu: Menu, eventDateISO: string, now: Date): boolean {
  if (!menu.active || menu.offline) return false;

  const eventDate = parseISO(eventDateISO);
  if (eventDate < startOfDay(parseISO(menu.availableFrom))) return false;
  if (eventDate > endOfDay(parseISO(menu.availableTo))) return false;
  if (!menu.availableDays.includes(getDay(eventDate))) return false;

  return now < getOrderCutoff(menu, eventDateISO);
}

export function menusForDate(menus: Menu[], eventDateISO: string, now: Date): Menu[] {
  return menus.filter((menu) => isMenuAvailableForDate(menu, eventDateISO, now));
}

export function validateMinimums(order: Order, menu: Menu, items: Item[]): string[] {
  const violations: string[] = [];

  if (order.subtotal < menu.minOrderValue) {
    violations.push(
      `This order's subtotal of ${formatMoney(order.subtotal)} is below the ${menu.name} minimum of ${formatMoney(menu.minOrderValue)}.`,
    );
  }
  if (order.headcount < menu.minPersons) {
    violations.push(`${menu.name} requires a minimum of ${menu.minPersons} people (headcount is ${order.headcount}).`);
  }
  for (const line of order.lines) {
    const item = items.find((i) => i.id === line.itemId);
    if (!item) continue;
    if (line.qty < item.minQty || line.qty > item.maxQty) {
      violations.push(`${line.nameSnapshot}: quantity must be between ${item.minQty} and ${item.maxQty}.`);
    }
  }

  return violations;
}

export function computeTotals(
  lines: OrderLine[],
  deliveryFee = 0,
  taxRate = 0,
): { subtotal: number; tax: number; total: number } {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + deliveryFee + tax);
  return { subtotal, tax, total };
}

export function requiresApproval(account: Account, total: number): boolean {
  return account.requiresApproval && total >= account.approvalThreshold;
}

const EDITABLE_STATUSES: OrderStatus[] = ['draft', 'submitted', 'confirmed'];
const CANCELLABLE_STATUSES: OrderStatus[] = ['draft', 'pending_approval', 'submitted', 'confirmed'];

export function canEditOrder(order: Order, menu: Menu, now: Date): boolean {
  return EDITABLE_STATUSES.includes(order.status) && now < getOrderCutoff(menu, order.eventDate);
}

export function canCancelOrder(order: Order, menu: Menu, now: Date): boolean {
  return CANCELLABLE_STATUSES.includes(order.status) && now < getOrderCutoff(menu, order.eventDate);
}
