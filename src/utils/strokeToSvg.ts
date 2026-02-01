/**
 * Converts stroke metadata paths to SVG path strings for dotted rendering.
 */

import type { StrokeMetadata } from '../types/strokeMetadata';

/**
 * Convert a stroke's path points to an SVG path string (d attribute).
 * Scales from metadata canvas size to target size.
 */
export function strokeToSvgPath(
  stroke: StrokeMetadata,
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): string {
  if (!stroke.path.length) return '';
  
  const scaleX = targetSize / sourceWidth;
  const scaleY = targetSize / sourceHeight;
  
  const commands: string[] = [];
  stroke.path.forEach((point, i) => {
    const x = point.x * scaleX;
    const y = point.y * scaleY;
    if (i === 0) {
      commands.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else {
      commands.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  });
  
  return commands.join(' ');
}
