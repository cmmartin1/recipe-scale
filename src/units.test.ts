import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertIngredient, convertRecipe } from './units.ts';

test('convertIngredient converts small volumes to ml', () => {
  const result = convertIngredient({ raw: '', quantity: 2, unit: 'cups', name: 'milk' }, 'metric');
  assert.equal(result.unit, 'ml');
  assert.ok(Math.abs((result.quantity as number) - 473.176) < 0.001);
});

test('convertIngredient converts large volumes to liters', () => {
  const result = convertIngredient({ raw: '', quantity: 5, unit: 'cups', name: 'water' }, 'metric');
  assert.equal(result.unit, 'l');
  assert.ok(Math.abs((result.quantity as number) - 1.18294) < 0.0001);
});

test('convertIngredient converts small weights to grams', () => {
  const result = convertIngredient({ raw: '', quantity: 1, unit: 'lb', name: 'butter' }, 'metric');
  assert.equal(result.unit, 'g');
  assert.ok(Math.abs((result.quantity as number) - 453.592) < 0.001);
});

test('convertIngredient converts large weights to kilograms', () => {
  const result = convertIngredient({ raw: '', quantity: 3, unit: 'lb', name: 'flour' }, 'metric');
  assert.equal(result.unit, 'kg');
  assert.ok(Math.abs((result.quantity as number) - 1.360776) < 0.0001);
});

test('convertIngredient converts metric volume back to cups when large enough', () => {
  const result = convertIngredient({ raw: '', quantity: 250, unit: 'ml', name: 'stock' }, 'imperial');
  assert.equal(result.unit, 'cups');
  assert.ok(Math.abs((result.quantity as number) - 1.0567) < 0.001);
});

test('convertIngredient converts small metric volume to tsp', () => {
  const result = convertIngredient({ raw: '', quantity: 5, unit: 'ml', name: 'vanilla' }, 'imperial');
  assert.equal(result.unit, 'tsp');
  assert.ok(Math.abs((result.quantity as number) - 1.0144) < 0.001);
});

test('convertIngredient converts metric weight back to lbs when large enough', () => {
  const result = convertIngredient({ raw: '', quantity: 500, unit: 'g', name: 'beef' }, 'imperial');
  assert.equal(result.unit, 'lbs');
  assert.ok(Math.abs((result.quantity as number) - 1.1023) < 0.001);
});

test('convertIngredient converts small metric weight to oz', () => {
  const result = convertIngredient({ raw: '', quantity: 100, unit: 'g', name: 'chocolate' }, 'imperial');
  assert.equal(result.unit, 'oz');
  assert.ok(Math.abs((result.quantity as number) - 3.5274) < 0.001);
});

test('convertIngredient leaves count-based units unchanged', () => {
  const ingredient = { raw: '', quantity: 3, unit: 'cloves', name: 'garlic' };
  assert.deepEqual(convertIngredient(ingredient, 'metric'), ingredient);
});

test('convertIngredient leaves quantity-less ingredients unchanged', () => {
  const ingredient = { raw: 'salt to taste', quantity: null, unit: null, name: 'salt to taste' };
  assert.deepEqual(convertIngredient(ingredient, 'metric'), ingredient);
});

test('convertRecipe converts every ingredient and preserves everything else', () => {
  const recipe = {
    title: 'Test',
    servings: 4,
    ingredients: [
      { raw: '', quantity: 1, unit: 'cup', name: 'flour' },
      { raw: '', quantity: null, unit: null, name: 'salt to taste' },
    ],
    notes: ['bake at 350F'],
  };
  const converted = convertRecipe(recipe, 'metric');
  assert.equal(converted.title, 'Test');
  assert.equal(converted.servings, 4);
  assert.deepEqual(converted.notes, ['bake at 350F']);
  assert.equal(converted.ingredients[0].unit, 'ml');
  assert.equal(converted.ingredients[1].quantity, null);
});
