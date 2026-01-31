/**
 * Shape similarity by canvas pixel comparison (inspired by OpenCV contour matching).
 * Both reference and user content are normalized to their bounding boxes and scaled
 * to the same comparison area so position/size don't penalize the score.
 */

const SIZE = 128;
const PAD = 8;
const STROKE_WIDTH = 8;
const THRESHOLD = 250; // pixel value below this = stroke (0-255)

export type RefPoint = [number, number];

/** Bounding box of reference stroke path(s). */
function refBbox(refStrokes: Array<Array<RefPoint>>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const stroke of refStrokes) {
    for (const [x, y] of stroke) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

/** Draw reference stroke path(s) onto 64x64, uniform scale to fit inner area (same as user). */
function drawRefToCanvas(
  ctx: CanvasRenderingContext2D,
  refStrokes: Array<Array<RefPoint>>
): void {
  const inner = SIZE - PAD * 2;
  const box = refBbox(refStrokes);
  const rangeX = box.maxX - box.minX || 1;
  const rangeY = box.maxY - box.minY || 1;
  const scale = Math.min(inner / rangeX, inner / rangeY);
  const dw = rangeX * scale;
  const dh = rangeY * scale;
  const dx = PAD + (inner - dw) / 2;
  const dy = PAD + (inner - dh) / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of refStrokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    const [x0, y0] = stroke[0];
    ctx.moveTo(
      dx + (x0 - box.minX) * scale,
      dy + (y0 - box.minY) * scale
    );
    for (let i = 1; i < stroke.length; i++) {
      const [x, y] = stroke[i];
      ctx.lineTo(
        dx + (x - box.minX) * scale,
        dy + (y - box.minY) * scale
      );
    }
    ctx.stroke();
  }
}

/** True if pixel is drawn stroke (opaque enough and not white). Practice canvas has transparent background. */
function isStrokePixel(data: ImageData, i: number): boolean {
  const r = data.data[i];
  const g = data.data[i + 1];
  const b = data.data[i + 2];
  const a = data.data[i + 3];
  return a > 64 && (r < THRESHOLD || g < THRESHOLD || b < THRESHOLD);
}

/** Find bounding box of stroke pixels (opaque, non-white) in canvas. */
function userStrokeBbox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const data = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isStrokePixel(data, i)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX || minY > maxY) return null;
  return { minX, minY, maxX, maxY };
}

/** Draw user canvas to 64x64: crop to stroke bbox, then scale to fill inner area (same as ref). */
function drawUserToCanvas(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const sw = source.width;
  const sh = source.height;
  if (sw === 0 || sh === 0) return;

  const srcCtx = source.getContext('2d');
  if (!srcCtx) return;
  const box = userStrokeBbox(srcCtx, sw, sh);
  if (!box) return;

  const cropW = box.maxX - box.minX + 1;
  const cropH = box.maxY - box.minY + 1;
  if (cropW <= 0 || cropH <= 0) return;

  const inner = SIZE - PAD * 2;
  const scale = Math.min(inner / cropW, inner / cropH);
  const dw = cropW * scale;
  const dh = cropH * scale;
  const dx = PAD + (inner - dw) / 2;
  const dy = PAD + (inner - dh) / 2;

  ctx.drawImage(
    source,
    box.minX, box.minY, cropW, cropH,
    dx, dy, dw, dh
  );
}

/** Count stroke pixels and compute Dice overlap. Ref = black (R<THRESHOLD); user = opaque non-white. */
function diceFromImageData(a: ImageData, b: ImageData): number {
  let countA = 0;
  let countB = 0;
  let intersection = 0;
  const len = a.data.length;
  for (let i = 0; i < len; i += 4) {
    const va = a.data[i] < THRESHOLD ? 1 : 0;
    const vb = isStrokePixel(b, i) ? 1 : 0;
    countA += va;
    countB += vb;
    intersection += va & vb;
  }
  const sum = countA + countB;
  if (sum === 0) return 0;
  return (2 * intersection) / sum;
}

/**
 * Returns shape similarity 0–100 (Dice overlap) between the user's canvas
 * and the reference stroke path(s). Both are normalized to their bounding
 * boxes and scaled to the same comparison area for alignment.
 */
export function computeShapeSimilarity(
  userCanvas: HTMLCanvasElement | null,
  refStrokes: Array<Array<RefPoint>> | undefined
): number | null {
  if (!userCanvas || !refStrokes?.length) return null;

  const refCanvas = document.createElement('canvas');
  refCanvas.width = SIZE;
  refCanvas.height = SIZE;
  const refCtx = refCanvas.getContext('2d');
  if (!refCtx) return null;
  drawRefToCanvas(refCtx, refStrokes);

  const userCanvasScaled = document.createElement('canvas');
  userCanvasScaled.width = SIZE;
  userCanvasScaled.height = SIZE;
  const userCtx = userCanvasScaled.getContext('2d');
  if (!userCtx) return null;
  drawUserToCanvas(userCtx, userCanvas);

  const refData = refCtx.getImageData(0, 0, SIZE, SIZE);
  const userData = userCtx.getImageData(0, 0, SIZE, SIZE);
  const dice = diceFromImageData(refData, userData);
  return Math.round(Math.max(0, Math.min(100, dice * 100)));
}
