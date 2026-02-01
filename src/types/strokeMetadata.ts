/**
 * Types for stroke-order animation metadata (e.g. from character_metadata.json).
 * Used to replay strokes in order on a canvas.
 */

export interface StrokePathPoint {
  x: number;
  y: number;
}

export interface StrokeMetadata {
  stroke_number: number;
  point_count: number;
  color: string;
  brush_size: number;
  duration_ms: number;
  path: StrokePathPoint[];
}

export interface CharacterAnimationMetadata {
  character: string;
  canvas_width: number;
  canvas_height: number;
  frame_rate?: number;
  frame_delay_ms?: number;
  total_frames?: number;
  stroke_count: number;
  strokes: StrokeMetadata[];
}

export async function fetchStrokeMetadata(
  url: string
): Promise<CharacterAnimationMetadata | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as CharacterAnimationMetadata;
    if (!data?.strokes?.length) return null;
    return data;
  } catch {
    return null;
  }
}
