# Reference stroke path data format

To show **stroke order accuracy**, we need reference path data for each letter.

## Format

For each letter you provide:

1. **`letterId`** – Same as in `achulu.ts` (e.g. `"a"`, `"aa"`, `"i"`).
2. **`strokeCount`** – Number of strokes in the correct writing order.
3. **`strokes`** – An array of strokes. **Order matters** (stroke 0 = first stroke, stroke 1 = second, etc.).

Each **stroke** is an array of points. Each **point** is `[x, y]` in **normalized coordinates**:

- **x, y** are between **0 and 1**.
- The letter is imagined inside a square: **(0, 0)** = top-left, **(1, 1)** = bottom-right.
- So the center of the letter is around **(0.5, 0.5)**.

## Example (one stroke, circle-like for అ)

```json
{
  "letterId": "a",
  "strokeCount": 1,
  "strokes": [
    [
      [0.5, 0.25], [0.72, 0.28], [0.85, 0.5], [0.72, 0.72],
      [0.5, 0.75], [0.28, 0.72], [0.15, 0.5], [0.28, 0.28], [0.5, 0.25]
    ]
  ]
}
```

## How to get the data

- **By hand:** Draw the letter in a 0–1 square (e.g. in a script or SVG), and write down points along each stroke (start, a few midpoints, end). More points = better matching.
- **From SVG:** If you have an SVG path per stroke, sample points along the path (e.g. 10–30 points per stroke) and normalize so the whole glyph fits in 0–1.
- **From a reference:** Trace a reference image (e.g. the dotted letter) in a 0–1 canvas and export the point list.

## Where to add it

In `src/data/strokeReference.ts`, add or extend the `REFERENCE` object. For each letter that has path data, set `strokes` to an array of strokes (each stroke = array of `[x, y]` pairs in 0–1).

```ts
const REFERENCE: Record<string, LetterStrokeReference> = {
  a: {
    letterId: 'a',
    strokeCount: 1,
    strokes: [
      [ [0.5, 0.25], [0.72, 0.28], ... ],  // stroke 0
    ],
  },
  // Add more letters with strokes arrays when you have data.
};
```

Once `strokes` is present for a letter, the app will compute **stroke order accuracy** by matching your drawn strokes to these reference strokes and reporting how many were in the correct order.
