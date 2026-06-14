import type { Unit } from './types';

const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export const UNIT_LABELS: Record<Unit, string> = {
  per_person: 'per person',
  per_platter: 'per platter',
  each: 'each',
};

export function formatUnit(unit: Unit): string {
  return UNIT_LABELS[unit];
}
