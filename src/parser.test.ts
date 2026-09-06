import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuantity, parseIngredientLine, parseRecipe } from './parser.ts';

test('parseQuantity reads mixed numbers, fractions, decimals, and integers', () => {
  assert.equal(parseQuantity('2 1/4'), 2.25);
  assert.equal(parseQuantity('3/4'), 0.75);
  assert.equal(parseQuantity('1.5'), 1.5);
  assert.equal(parseQuantity('2'), 2);
});

test('parseIngredientLine splits quantity, unit, and name', () => {
  assert.deepEqual(parseIngredientLine('2 1/4 cups all-purpose flour'), {
    raw: '2 1/4 cups all-purpose flour',
    quantity: 2.25,
    unit: 'cups',
    name: 'all-purpose flour',
  });
  assert.deepEqual(parseIngredientLine('1 tsp baking soda'), {
    raw: '1 tsp baking soda',
    quantity: 1,
    unit: 'tsp',
    name: 'baking soda',
  });
});

test('parseIngredientLine keeps free text with no quantity untouched', () => {
  const ingredient = parseIngredientLine('salt to taste');
  assert.equal(ingredient.quantity, null);
  assert.equal(ingredient.unit, null);
  assert.equal(ingredient.name, 'salt to taste');
});

test('parseIngredientLine treats an unrecognized word after the quantity as part of the name', () => {
  const ingredient = parseIngredientLine('2 large eggs');
  assert.equal(ingredient.quantity, 2);
  assert.equal(ingredient.unit, null);
  assert.equal(ingredient.name, 'large eggs');
});

test('parseRecipe reads title, servings, ingredients, and notes', () => {
  const text = `
title: Chocolate Chip Cookies
servings: 24

2 1/4 cups all-purpose flour
1 tsp baking soda
salt to taste
# bake at 375F for 9-11 minutes
`;

  const recipe = parseRecipe(text);
  assert.equal(recipe.title, 'Chocolate Chip Cookies');
  assert.equal(recipe.servings, 24);
  assert.equal(recipe.ingredients.length, 3);
  assert.equal(recipe.ingredients[0].name, 'all-purpose flour');
  assert.equal(recipe.ingredients[2].quantity, null);
  assert.deepEqual(recipe.notes, ['bake at 375F for 9-11 minutes']);
});

test('parseRecipe falls back to defaults when header lines are missing', () => {
  const recipe = parseRecipe('1 cup water\n');
  assert.equal(recipe.title, 'Untitled recipe');
  assert.equal(recipe.servings, null);
  assert.equal(recipe.ingredients.length, 1);
});
