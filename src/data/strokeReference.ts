/**
 * Reference stroke data for Telugu letters.
 * Used to show "this letter has N strokes" and (future) stroke-order accuracy.
 *
 * Format: when we have full path data, each entry can include stroke paths
 * for matching. For now we only store stroke count where known.
 */

export interface LetterStrokeReference {
  letterId: string;
  /** Number of strokes in the correct writing order. */
  strokeCount: number;
  /**
   * Optional: ordered stroke paths for shape/order matching.
   * Each stroke is an array of [x, y] in normalized 0–1 space.
   * Omit until we have data.
   */
  strokes?: Array<Array<[number, number]>>;
}

/** Known reference data: letterId -> stroke count (and optional paths later). */
const REFERENCE: Record<string, LetterStrokeReference> = {
  // అ – one stroke (circle). Points in normalized 0–1.
  a: {
    letterId: 'a',
    strokeCount: 1,
    strokes: [
      [
        [0.5, 0.2], // start (top)
        [0.65, 0.25],
        [0.78, 0.4],
        [0.8, 0.55],
        [0.72, 0.72],
        [0.55, 0.8],
        [0.38, 0.75],
        [0.25, 0.6],
        [0.22, 0.45],
        [0.3, 0.3],
        [0.42, 0.22],
        [0.5, 0.2], // close loop
      ],
    ],
  },
  // ఆ – second vowel; stroke-order animation in public/animations/aa.gif
  aa: {
    letterId: 'aa',
    strokeCount: 1,
    strokes: [
      [
        // loop start
        [0.5, 0.2],
        [0.65, 0.25],
        [0.78, 0.4],
        [0.8, 0.55],
        [0.72, 0.72],
        [0.55, 0.8],
        [0.38, 0.75],
        [0.25, 0.6],
        [0.22, 0.45],
        [0.3, 0.3],
        [0.42, 0.22],
  
        // transition into aa tail (no pen lift)
        [0.55, 0.25],
        [0.68, 0.32],
        [0.78, 0.42],
        [0.85, 0.55],
        [0.88, 0.7],
        [0.85, 0.9],
      ],
    ],
  },
  
};

/**
 * Returns the reference stroke count for a letter, or null if unknown.
 */
export function getStrokeCountForLetter(letterId: string): number | null {
  const ref = REFERENCE[letterId];
  return ref ? ref.strokeCount : null;
}

/**
 * Returns full reference for a letter (for future accuracy matching).
 */
export function getStrokeReference(letterId: string): LetterStrokeReference | null {
  return REFERENCE[letterId] ?? null;
}
