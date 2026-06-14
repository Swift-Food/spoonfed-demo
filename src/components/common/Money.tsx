import { formatMoney } from '../../lib/money';

export default function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={className}>{formatMoney(amount)}</span>;
}
