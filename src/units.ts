// Converts ingredient quantities between US customary (imperial) and
// metric volume/weight units. Count-based units (clove, pinch, can,
// stick) have no metric equivalent and pass through unchanged.

import type { Recipe, Ingredient } from './parser.ts';

export type UnitSystem = 'metric' | 'imperial';

// Size of each unit in ml, the volume base unit.
const VOLUME_TO_ML: Record<string, number> = {
  tsp: 4.92892, teaspoon: 4.92892, teaspoons: 4.92892,
  tbsp: 14.7868, tablespoon: 14.7868, tablespoons: 14.7868,
  cup: 236.588, cups: 236.588,
  pint: 473.176, pints: 473.176,
  quart: 946.353, quarts: 946.353,
  gallon: 3785.41, gallons: 3785.41,
  ml: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
};

// Size of each unit in g, the weight base unit.
const WEIGHT_TO_G: Record<string, number> = {
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  g: 1, gram: 1, grams: 1,
  kg: 1000,
};

export const METRIC_UNITS = new Set([
  'g', 'gram', 'grams', 'kg', 'ml', 'l', 'liter', 'liters', 'litre', 'litres',
]);

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\.$/, '');
}

// Picks liters once the number of ml gets awkward to read.
function bestMetricVolume(ml: number): [number, string] {
  if (ml >= 1000) return [ml / 1000, 'l'];
  return [ml, 'ml'];
}

// Picks kilograms once the number of grams gets awkward to read.
function bestMetricWeight(g: number): [number, string] {
  if (g >= 1000) return [g / 1000, 'kg'];
  return [g, 'g'];
}

// Prefers cups down to a quarter cup, then tablespoons down to one, then
// teaspoons, since "1/16 cup" is a worse read than "1 tbsp".
function bestImperialVolume(ml: number): [number, string] {
  const cups = ml / VOLUME_TO_ML.cup;
  if (cups >= 0.25) return [cups, cups === 1 ? 'cup' : 'cups'];
  const tbsp = ml / VOLUME_TO_ML.tbsp;
  if (tbsp >= 1) return [tbsp, 'tbsp'];
  return [ml / VOLUME_TO_ML.tsp, 'tsp'];
}

// Prefers pounds once there's a full pound's worth of ounces.
function bestImperialWeight(g: number): [number, string] {
  const oz = g / WEIGHT_TO_G.oz;
  if (oz >= 16) return [oz / 16, oz / 16 === 1 ? 'lb' : 'lbs'];
  return [oz, 'oz'];
}

export function convertIngredient(ingredient: Ingredient, system: UnitSystem): Ingredient {
  if (ingredient.quantity === null || ingredient.unit === null) return ingredient;
  const unit = normalizeUnit(ingredient.unit);

  if (unit in VOLUME_TO_ML) {
    const ml = ingredient.quantity * VOLUME_TO_ML[unit];
    const [quantity, newUnit] = system === 'metric' ? bestMetricVolume(ml) : bestImperialVolume(ml);
    return { ...ingredient, quantity, unit: newUnit };
  }

  if (unit in WEIGHT_TO_G) {
    const g = ingredient.quantity * WEIGHT_TO_G[unit];
    const [quantity, newUnit] = system === 'metric' ? bestMetricWeight(g) : bestImperialWeight(g);
    return { ...ingredient, quantity, unit: newUnit };
  }

  return ingredient;
}

export function convertRecipe(recipe: Recipe, system: UnitSystem): Recipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => convertIngredient(ingredient, system)),
  };
}
