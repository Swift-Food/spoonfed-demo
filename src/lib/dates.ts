import { parseISO, subDays, set } from 'date-fns';
import type { Menu } from './types';

export function toDate(iso: string): Date {
  return parseISO(iso);
}

/**
 * Latest moment an order can be placed/edited for a menu on a given event date:
 * lead time (rounded up to whole days) before the event, at the menu's cutoff time.
 */
export function getOrderCutoff(menu: Menu, eventDateISO: string): Date {
  const leadDays = Math.ceil(menu.leadTimeHours / 24);
  const cutoffDay = subDays(parseISO(eventDateISO), leadDays);
  const [hours, minutes] = menu.cutoffTime.split(':').map(Number);
  return set(cutoffDay, { hours, minutes, seconds: 0, milliseconds: 0 });
}
