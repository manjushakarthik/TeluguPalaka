/**
 * Validates user-drawn stroke against reference stroke path.
 * Uses path resampling and average nearest-point distance.
 */

import type { StrokePathPoint } from '../types/strokeMetadata';

const SAMPLE_POINTS = 32;

function resamplePath(points: Array<{ x: number; y: number }>, n: number): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  const totalLen = pathLength(points);
  if (totalLen === 0) return points.slice(0, n);
  const result: Array<{ x: number; y: number }> = [];
  let walked = 0;
  let segIdx = 0;
  let segStart = points[0];
  let segEnd = points[1];
  let segLen = dist(segStart, segEnd);

  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * totalLen;
    while (segIdx < points.length - 1 && walked + segLen < target - 1e-6) {
      walked += segLen;
      segIdx++;
      segStart = points[segIdx];
      segEnd = points[segIdx + 1];
      segLen = dist(segStart, segEnd);
    }
    if (segIdx >= points.length - 1) {
      result.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
      continue;
    }
    const t = segLen === 0 ? 0 : (target - walked) / segLen;
    result.push({
      x: segStart.x + t * (segEnd.x - segStart.x),
      y: segStart.y + t * (segEnd.y - segStart.y),
    });
  }
  return result;
}

function pathLength(points: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += dist(points[i - 1], points[i]);
  }
  return len;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function bbox(points: Array<{ x: number; y: number }>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/** Normalize points to 0–1 range using their bounding box. */
function normalizeToUnit(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const box = bbox(points);
  const rangeX = box.maxX - box.minX || 1;
  const rangeY = box.maxY - box.minY || 1;
  return points.map((p) => ({
    x: (p.x - box.minX) / rangeX,
    y: (p.y - box.minY) / rangeY,
  }));
}

/** Average distance from each point in A to nearest point in B. */
function avgNearestDistance(a: Array<{ x: number; y: number }>, b: Array<{ x: number; y: number }>): number {
  let sum = 0;
  for (const pa of a) {
    let minD = Infinity;
    for (const pb of b) {
      minD = Math.min(minD, dist(pa, pb));
    }
    sum += minD;
  }
  return a.length ? sum / a.length : 0;
}

/**
 * Returns a match score 0–100. Higher = better match.
 * Uses normalized paths and average nearest-point distance in both directions.
 */
export function strokeMatchScore(
  userPoints: Array<{ x: number; y: number }>,
  refPath: StrokePathPoint[],
  _refWidth: number,
  _refHeight: number,
  userSize: number
): number {
  if (userPoints.length < 3 || refPath.length < 2) return 0;

  const refNorm = normalizeToUnit(refPath.map((p) => ({ x: p.x, y: p.y })));
  const userNorm = normalizeToUnit(
    userPoints.map((p) => ({ x: p.x / userSize, y: p.y / userSize }))
  );

  const refSampled = resamplePath(refNorm, SAMPLE_POINTS);
  const userSampled = resamplePath(userNorm, SAMPLE_POINTS);

  const d1 = avgNearestDistance(userSampled, refSampled);
  const d2 = avgNearestDistance(refSampled, userSampled);
  const avgDist = (d1 + d2) / 2;

  const maxAcceptableDist = 0.25;
  const score = Math.max(0, 100 - (avgDist / maxAcceptableDist) * 100);
  return Math.round(Math.min(100, score));
}

export const STROKE_MATCH_THRESHOLD = 45;
