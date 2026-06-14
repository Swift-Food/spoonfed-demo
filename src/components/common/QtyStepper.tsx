import { Minus, Plus } from 'lucide-react';

interface QtyStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export default function QtyStepper({ value, min, max, onChange }: QtyStepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-eden-sage text-eden-green transition-colors hover:bg-eden-sage/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-eden-charcoal">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-eden-sage text-eden-green transition-colors hover:bg-eden-sage/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
