import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'warning';
  onDismiss?: () => void;
}

const VARIANT_STYLES: Record<NonNullable<ToastProps['variant']>, string> = {
  info: 'border-eden-sage bg-white text-eden-charcoal',
  success: 'border-eden-leaf bg-eden-leaf/10 text-eden-green',
  warning: 'border-eden-amber bg-eden-amber/10 text-eden-amber',
};

export default function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-sm ${VARIANT_STYLES[variant]}`}>
      <span className="text-sm">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
