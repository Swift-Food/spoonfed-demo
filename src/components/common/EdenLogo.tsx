import { Flower2 } from 'lucide-react';

interface EdenLogoProps {
  size?: 'sm' | 'lg';
  showWordmark?: boolean;
}

const SIZES = {
  sm: { circle: 'h-8 w-8', icon: 16, text: 'text-lg' },
  lg: { circle: 'h-14 w-14', icon: 28, text: 'text-3xl' },
};

export default function EdenLogo({ size = 'sm', showWordmark = true }: EdenLogoProps) {
  const s = SIZES[size];
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex ${s.circle} items-center justify-center rounded-full bg-eden-green`}>
        <Flower2 size={s.icon} className="text-eden-cream" />
      </span>
      {showWordmark && (
        <span className={`font-serif font-semibold ${s.text} text-eden-green`}>Eden Caterers</span>
      )}
    </div>
  );
}
