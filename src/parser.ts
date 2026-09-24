// Parses a plain-text recipe file into ingredients recipe-scale can do math on.
//
// File format:
//   title: Chocolate Chip Cookies
//   servings: 24
//
//   2 1/4 cups all-purpose flour
//   1 tsp baking soda
//   3/4 cup granulated sugar
//   salt to taste
//   # bake at 375F for 9-11 minutes
//
// One ingredient per line. Lines starting with "#" are notes and pass
// through untouched. Anything without a leading quantity (like "salt to
// taste") is kept as free text rather than rejected.

export interface Ingredient {
  raw: string;
  quantity: number | null;
  unit: string | null;
  name: string;
}

export interface Recipe {
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  notes: string[];
}

const KNOWN_UNITS = new Set([
  'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'g', 'gram', 'grams',
  'kg', 'ml', 'l', 'liter', 'liters', 'litre', 'litres', 'pinch', 'pinches',
  'clove', 'cloves', 'can', 'cans', 'stick', 'sticks', 'quart', 'quarts',
  'pint', 'pints', 'gallon', 'gallons',
]);

// Unicode vulgar fraction characters, as they show up in copy-pasted
// recipes ("2¾ cups", "¾ cup").
const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅐': 1 / 7,
  '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
  '⅑': 1 / 9,
  '⅒': 1 / 10,
};
const UNICODE_FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join('');

// Matches a leading amount: a mixed number ("2 1/4"), a plain fraction
// ("3/4"), a decimal ("1.5"), a bare integer ("2"), or any of those forms
// written with a unicode fraction character ("2¾", "2 ¾", "¾").
const QUANTITY_RE = new RegExp(
  `^(\\d+\\s*[${UNICODE_FRACTION_CHARS}]|\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d*\\.\\d+|\\d+|[${UNICODE_FRACTION_CHARS}])\\s*`,
);

export function parseQuantity(text: string): number {
  const trimmed = text.trim();

  const unicodeMixed = trimmed.match(new RegExp(`^(\\d+)\\s*([${UNICODE_FRACTION_CHARS}])$`));
  if (unicodeMixed) {
    const [, whole, frac] = unicodeMixed;
    return Number(whole) + UNICODE_FRACTIONS[frac];
  }
  if (trimmed in UNICODE_FRACTIONS) {
    return UNICODE_FRACTIONS[trimmed];
  }

  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const [, whole, num, den] = mixed;
    return Number(whole) + Number(num) / Number(den);
  }
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const [, num, den] = fraction;
    return Number(num) / Number(den);
  }
  return Number(trimmed);
}

export function parseIngredientLine(line: string): Ingredient {
  const raw = line.trim();
  const match = raw.match(QUANTITY_RE);
  if (!match) {
    return { raw, quantity: null, unit: null, name: raw };
  }

  const quantity = parseQuantity(match[1]);
  const rest = raw.slice(match[0].length).trim();
  const unitMatch = rest.match(/^([a-zA-Z]+\.?)\s+(.*)$/);

  if (unitMatch && KNOWN_UNITS.has(unitMatch[1].toLowerCase().replace(/\.$/, ''))) {
    return { raw, quantity, unit: unitMatch[1], name: unitMatch[2] };
  }
  return { raw, quantity, unit: null, name: rest };
}

export function parseRecipe(text: string): Recipe {
  let title = 'Untitled recipe';
  let servings: number | null = null;
  const ingredients: Ingredient[] = [];
  const notes: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const titleMatch = line.match(/^title:\s*(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const servingsMatch = line.match(/^servings:\s*(\d+)/i);
    if (servingsMatch) {
      servings = Number(servingsMatch[1]);
      continue;
    }

    if (line.startsWith('#')) {
      notes.push(line.slice(1).trim());
      continue;
    }

    ingredients.push(parseIngredientLine(line));
  }

  return { title, servings, ingredients, notes };
}
