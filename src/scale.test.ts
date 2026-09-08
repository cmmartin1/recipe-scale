import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRecipe } from './parser.ts';
import {
  scaleFactorFromServings,
  scaleIngredient,
  scaleRecipe,
  formatQuantity,
  formatIngredient,
} from './scale.ts';

test('scaleFactorFromServings divides target by the recipe yield', () => {
  const recipe = parseRecipe('title: Test\nservings: 24\n1 cup flour\n');
  assert.equal(scaleFactorFromServings(recipe, 36), 1.5);
});

test('scaleFactorFromServings rejects a recipe with no servings line', () => {
  const recipe = parseRecipe('1 cup flour\n');
  assert.throws(() => scaleFactorFromServings(recipe, 36), /no "servings:" line/);
});

test('scaleIngredient multiplies quantity and leaves quantity-less lines alone', () => {
  const withQuantity = scaleIngredient(
    { raw: '1 cup flour', quantity: 1, unit: 'cup', name: 'flour' },
    1.5,
  );
  assert.equal(withQuantity.quantity, 1.5);

  const withoutQuantity = scaleIngredient(
    { raw: 'salt to taste', quantity: null, unit: null, name: 'salt to taste' },
    1.5,
  );
  assert.equal(withoutQuantity.quantity, null);
});

test('scaleRecipe scales servings and every ingredient', () => {
  const recipe = parseRecipe('servings: 24\n2 cups flour\n1 tsp salt\n');
  const scaled = scaleRecipe(recipe, 1.5);
  assert.equal(scaled.servings, 36);
  assert.equal(scaled.ingredients[0].quantity, 3);
  assert.equal(scaled.ingredients[1].quantity, 1.5);
});

test('formatQuantity renders whole numbers without a fraction', () => {
  assert.equal(formatQuantity(3), '3');
});

test('formatQuantity snaps close decimals to the nearest kitchen fraction', () => {
  assert.equal(formatQuantity(2.25), '2 1/4');
  assert.equal(formatQuantity(0.75), '3/4');
  assert.equal(formatQuantity(1 + 1 / 3), '1 1/3');
});

test('formatQuantity falls back to a decimal when nothing fractional is close enough', () => {
  assert.equal(formatQuantity(0.2), '0.2');
});

test('formatQuantity treats zero and negative values as empty', () => {
  assert.equal(formatQuantity(0), '0');
  assert.equal(formatQuantity(-1), '0');
});

test('formatIngredient combines quantity, unit, and name', () => {
  assert.equal(
    formatIngredient({ raw: '', quantity: 2.25, unit: 'cups', name: 'all-purpose flour' }),
    '2 1/4 cups all-purpose flour',
  );
  assert.equal(
    formatIngredient({ raw: '', quantity: null, unit: null, name: 'salt to taste' }),
    'salt to taste',
  );
});

test('formatIngredient renders metric units as decimals instead of kitchen fractions', () => {
  assert.equal(
    formatIngredient({ raw: '', quantity: 473.176, unit: 'ml', name: 'milk' }),
    '473.2 ml milk',
  );
  assert.equal(
    formatIngredient({ raw: '', quantity: 1.360776, unit: 'kg', name: 'flour' }),
    '1.4 kg flour',
  );
  assert.equal(
    formatIngredient({ raw: '', quantity: 500, unit: 'g', name: 'butter' }),
    '500 g butter',
  );
});
