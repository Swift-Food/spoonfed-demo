import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}

export default function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={htmlFor}>
      <span className="font-medium text-eden-charcoal">{label}</span>
      {children}
      {hint && <span className="text-xs text-eden-stone">{hint}</span>}
    </label>
  );
}
