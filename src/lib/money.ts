const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}
