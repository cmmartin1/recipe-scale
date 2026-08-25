// Scaling math and quantity formatting. Kept separate from parsing so the
// two can be tested independently of file I/O.

import type { Recipe, Ingredient } from './parser.ts';

export function scaleFactorFromServings(recipe: Recipe, targetServings: number): number {
  if (!recipe.servings || recipe.servings <= 0) {
    throw new Error('recipe has no "servings:" line; use --factor instead of --servings');
  }
  return targetServings / recipe.servings;
}

export function scaleIngredient(ingredient: Ingredient, factor: number): Ingredient {
  if (ingredient.quantity === null) return ingredient;
  return { ...ingredient, quantity: ingredient.quantity * factor };
}

export function scaleRecipe(recipe: Recipe, factor: number): Recipe {
  return {
    ...recipe,
    servings: recipe.servings !== null ? round(recipe.servings * factor) : null,
    ingredients: recipe.ingredients.map((ingredient) => scaleIngredient(ingredient, factor)),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Common kitchen fractions, checked closest-first when turning a decimal
// back into something you'd actually write on a shopping list.
const FRACTIONS: Array<[number, string]> = [
  [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'],
];

export function formatQuantity(value: number): string {
  if (value <= 0) return '0';

  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  if (frac < 0.02) return String(whole);

  let best = FRACTIONS[0];
  let bestDiff = Math.abs(frac - best[0]);
  for (const candidate of FRACTIONS) {
    const diff = Math.abs(frac - candidate[0]);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }

  // Not close enough to a clean kitchen fraction; fall back to a decimal
  // rather than lying with a fraction that's off by a noticeable amount.
  if (bestDiff > 0.04) {
    return String(Math.round(value * 100) / 100);
  }

  return whole > 0 ? `${whole} ${best[1]}` : best[1];
}

export function formatIngredient(ingredient: Ingredient): string {
  if (ingredient.quantity === null) return ingredient.name;
  const unit = ingredient.unit ? `${ingredient.unit} ` : '';
  return `${formatQuantity(ingredient.quantity)} ${unit}${ingredient.name}`;
}
