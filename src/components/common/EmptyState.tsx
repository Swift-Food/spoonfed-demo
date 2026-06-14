import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-eden-sage/40 bg-white px-6 py-12 text-center">
      {icon && <div className="text-eden-sage">{icon}</div>}
      <h3 className="font-serif text-xl text-eden-green">{title}</h3>
      {description && <p className="max-w-md text-sm text-eden-stone">{description}</p>}
      {action}
    </div>
  );
}
