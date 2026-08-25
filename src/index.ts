#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseRecipe } from './parser.ts';
import { scaleRecipe, scaleFactorFromServings, formatIngredient } from './scale.ts';

function printUsage(): void {
  console.log(`usage: recipe-scale <file> [--factor N | --servings N]

  --factor N     multiply every quantity by N
  --servings N   scale so the recipe yields N servings
                 (requires a "servings:" line in the recipe file)

example:
  recipe-scale cookies.recipe --servings 36
`);
}

interface Args {
  file: string;
  factor?: number;
  servings?: number;
}

function parseArgs(argv: string[]): Args {
  const [file, ...rest] = argv;
  if (!file || file === '--help' || file === '-h') {
    printUsage();
    process.exit(file ? 0 : 1);
  }

  let factor: number | undefined;
  let servings: number | undefined;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--factor') {
      factor = Number(rest[++i]);
    } else if (arg === '--servings') {
      servings = Number(rest[++i]);
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return { file, factor, servings };
}

function main(): void {
  const { file, factor, servings } = parseArgs(process.argv.slice(2));

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

  const scaled = scaleRecipe(recipe, appliedFactor);

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
