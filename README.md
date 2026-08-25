# recipe-scale

Doubling a recipe by hand is where fractions go to die. "1 1/3 cups" times
1.5 is not something most people want to work out at the counter with
flour on their hands, and recipe apps that do this tend to also want you to
create an account. This is a command-line tool that just does the
arithmetic: give it a recipe file and either a scale factor or a target
serving count, and it prints the scaled ingredient list.

## Usage

```
recipe-scale <file> [--factor N | --servings N]
```

Given `cookies.recipe`:

```
title: Chocolate Chip Cookies
servings: 24

2 1/4 cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup butter, softened
3/4 cup granulated sugar
3/4 cup packed brown sugar
2 large eggs
2 cups chocolate chips
# bake at 375F for 9 to 11 minutes
```

Scale to a specific yield:

```
$ recipe-scale cookies.recipe --servings 36
Chocolate Chip Cookies
servings: 36

  3 3/8 cups all-purpose flour
  1 1/2 tsp baking soda
  1 1/2 tsp salt
  1 1/2 cup butter, softened
  1 1/8 cup granulated sugar
  1 1/8 cup packed brown sugar
  3 large eggs
  3 cups chocolate chips

# bake at 375F for 9 to 11 minutes
```

Or scale by a raw multiplier, which works even without a `servings:` line:

```
$ recipe-scale cookies.recipe --factor 0.5
```

## Recipe file format

Plain text, one ingredient per line:

- `title: ...` and `servings: N` are optional header lines.
- Ingredient lines start with a quantity: a whole number (`2`), a fraction
  (`3/4`), a mixed number (`2 1/4`), or a decimal (`1.5`), optionally
  followed by a unit and then the ingredient name.
- Lines with no leading quantity (`salt to taste`) are kept as-is and pass
  through unscaled.
- Lines starting with `#` are notes (oven temperature, timing, technique)
  and are printed back unchanged, after the ingredient list.

Quantities are converted back to the nearest common kitchen fraction
(eighths, thirds) when printed, rather than dumped as long decimals.

## Running it

No dependencies to install. This targets Node's built-in TypeScript
support directly, no build step:

```
node src/index.ts cookies.recipe --servings 36
```

Node 22.6+ needs the `--experimental-strip-types` flag for that; Node
23.6+ runs `.ts` files like this without any flag.

## Status

Early skeleton: quantity parsing, scaling, and fraction formatting work
for straightforward recipe files. Unit conversion and more forgiving
parsing of messy real-world recipes are not there yet.

## License

MIT, see LICENSE.
