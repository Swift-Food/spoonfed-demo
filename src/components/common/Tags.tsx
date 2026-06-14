import type { Allergen, DietaryTag } from '../../lib/types';
import { ALLERGEN_LABELS, DIETARY_LABELS } from '../../lib/labels';

export function DietaryTags({ tags }: { tags: DietaryTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-eden-leaf/15 px-2.5 py-0.5 text-xs font-medium text-eden-green">
          {DIETARY_LABELS[tag]}
        </span>
      ))}
    </div>
  );
}

export function AllergenTags({ allergens }: { allergens: Allergen[] }) {
  if (allergens.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {allergens.map((allergen) => (
        <span
          key={allergen}
          className="rounded-full border border-eden-stone/40 px-2.5 py-0.5 text-xs text-eden-stone"
        >
          Contains {ALLERGEN_LABELS[allergen]}
        </span>
      ))}
    </div>
  );
}
