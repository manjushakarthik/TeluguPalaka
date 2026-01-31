/**
 * Computes stroke order accuracy by matching user strokes to reference strokes.
 * - 100%: one stroke (ref has 1, user drew 1).
 * - 0%: wrong stroke count (e.g. multiple strokes when ref has 1).
 */

export type Point = { x: number; y: number };
export type RefPoint = [number, number];

function centroid(points: Point[] | RefPoint[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    const [x, y] = Array.isArray(p) ? p : [p.x, p.y];
    sx += x;
    sy += y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

/** Normalize user strokes to 0–1 bounding box (same as reference). */
function normalizeStrokes(
  strokes: Array<Array<Point>>
): Array<Array<{ x: number; y: number }>> {
  if (strokes.length === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return strokes.map((stroke) =>
    stroke.map((p) => ({
      x: (p.x - minX) / rangeX,
      y: (p.y - minY) / rangeY,
    }))
  );
}

/** Match each user stroke to the reference stroke with closest centroid. */
function matchStrokes(
  userStrokes: Array<Array<{ x: number; y: number }>>,
  refStrokes: Array<Array<RefPoint>>
): number[] {
  const userCentroids = userStrokes.map((s) => centroid(s));
  const refCentroids = refStrokes.map((s) => centroid(s));
  const matched: number[] = [];
  const used = new Set<number>();

  for (const uc of userCentroids) {
    let best = -1;
    let bestDist = Infinity;
    for (let r = 0; r < refCentroids.length; r++) {
      if (used.has(r)) continue;
      const rc = refCentroids[r];
      const d = (uc.x - rc.x) ** 2 + (uc.y - rc.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = r;
      }
    }
    matched.push(best >= 0 ? best : 0);
    if (best >= 0) used.add(best);
  }

  return matched;
}

/**
 * Returns stroke order accuracy as a number 0–100, or null if we can't compute.
 * - 100%: one stroke (user drew 1, ref has 1).
 * - 0%: wrong stroke count (multiple strokes when ref has 1).
 */
export function computeStrokeOrderAccuracy(
  userStrokes: Array<Array<Point>>,
  refStrokes: Array<Array<RefPoint>>
): number | null {
  if (refStrokes.length === 0 || userStrokes.length === 0) return null;

  const normalized = normalizeStrokes(userStrokes);

  // Wrong number of strokes → 0%
  if (userStrokes.length !== refStrokes.length) {
    return 0;
  }

  // Single stroke: always 100% (no point-count check; avoids 50% when move events don't add points)
  if (refStrokes.length === 1 && normalized.length === 1) {
    return 100;
  }

  // Multiple strokes: order accuracy
  const matched = matchStrokes(normalized, refStrokes);
  let correctPairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < matched.length; i++) {
    for (let j = i + 1; j < matched.length; j++) {
      totalPairs++;
      if (matched[i] < matched[j]) correctPairs++;
    }
  }

  if (totalPairs === 0) return 100;
  return Math.round((correctPairs / totalPairs) * 100);
}
