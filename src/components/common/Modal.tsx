import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-eden-charcoal/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-serif text-xl text-eden-green">{title}</h2>}
          <button type="button" onClick={onClose} aria-label="Close" className="text-eden-stone hover:text-eden-charcoal">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
