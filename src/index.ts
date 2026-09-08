#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseRecipe } from './parser.ts';
import { scaleRecipe, scaleFactorFromServings, formatIngredient } from './scale.ts';
import { convertRecipe, type UnitSystem } from './units.ts';

function printUsage(): void {
  console.log(`usage: recipe-scale <file> [--factor N | --servings N] [--units metric|imperial]

  --factor N     multiply every quantity by N
  --servings N   scale so the recipe yields N servings
                 (requires a "servings:" line in the recipe file)
  --units SYS    convert ingredient units to "metric" or "imperial"

example:
  recipe-scale cookies.recipe --servings 36
  recipe-scale cookies.recipe --factor 2 --units metric
`);
}

interface Args {
  file: string;
  factor?: number;
  servings?: number;
  units?: UnitSystem;
}

function parseArgs(argv: string[]): Args {
  const [file, ...rest] = argv;
  if (!file || file === '--help' || file === '-h') {
    printUsage();
    process.exit(file ? 0 : 1);
  }

  let factor: number | undefined;
  let servings: number | undefined;
  let units: UnitSystem | undefined;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--factor') {
      factor = Number(rest[++i]);
    } else if (arg === '--servings') {
      servings = Number(rest[++i]);
    } else if (arg === '--units') {
      const value = rest[++i];
      if (value !== 'metric' && value !== 'imperial') {
        throw new Error(`--units must be "metric" or "imperial", got: ${value}`);
      }
      units = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return { file, factor, servings, units };
}

function main(): void {
  const { file, factor, servings, units } = parseArgs(process.argv.slice(2));

  if (factor === undefined && servings === undefined) {
    throw new Error('specify --factor or --servings (see --help)');
  }
  if (factor !== undefined && servings !== undefined) {
    throw new Error('specify only one of --factor or --servings');
  }

  const text = readFileSync(file, 'utf8');
  const recipe = parseRecipe(text);

  const appliedFactor = factor !== undefined ? factor : scaleFactorFromServings(recipe, servings as number);
  if (!Number.isFinite(appliedFactor) || appliedFactor <= 0) {
    throw new Error('scale factor must be a positive number');
  }

  const scaled = units ? convertRecipe(scaleRecipe(recipe, appliedFactor), units) : scaleRecipe(recipe, appliedFactor);

  console.log(scaled.title);
  if (scaled.servings !== null) {
    console.log(`servings: ${scaled.servings}`);
  }
  console.log('');
  for (const ingredient of scaled.ingredients) {
    console.log(`  ${formatIngredient(ingredient)}`);
  }
  if (scaled.notes.length > 0) {
    console.log('');
    for (const note of scaled.notes) {
      console.log(`# ${note}`);
    }
  }
}

try {
  main();
} catch (err) {
  console.error(`error: ${(err as Error).message}`);
  process.exit(1);
}
