import type { Allergen, DietaryTag } from './types';

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  gluten_free: 'Gluten-free',
  halal: 'Halal',
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  dairy: 'Dairy',
  nuts: 'Nuts',
  egg: 'Egg',
  soy: 'Soy',
  shellfish: 'Shellfish',
  fish: 'Fish',
};
