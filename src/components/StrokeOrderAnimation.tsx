import { useRef, useEffect, useState, useCallback } from 'react';
import type { CharacterAnimationMetadata, StrokeMetadata } from '../types/strokeMetadata';
import { fetchStrokeMetadata } from '../types/strokeMetadata';

const DISPLAY_SIZE = 200;

interface StrokeOrderAnimationProps {
  metadataUrl: string | null;
  replayKey: number;
  onReplay?: () => void;
}

export function StrokeOrderAnimation({
  metadataUrl,
  replayKey,
  onReplay,
}: StrokeOrderAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metadata, setMetadata] = useState<CharacterAnimationMetadata | null>(null);
  const [loading, setLoading] = useState(!!metadataUrl);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!metadataUrl) {
      setMetadata(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchStrokeMetadata(metadataUrl).then((data) => {
      setMetadata(data ?? null);
      setLoading(false);
    });
  }, [metadataUrl]);

  const drawStrokeProgress = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: StrokeMetadata, progress: number) => {
      const path = stroke.path;
      if (!path.length) return;
      const w = metadata!.canvas_width;
      const h = metadata!.canvas_height;
      const scale = Math.min(DISPLAY_SIZE / w, DISPLAY_SIZE / h);
      const offsetX = (DISPLAY_SIZE - w * scale) / 2;
      const offsetY = (DISPLAY_SIZE - h * scale) / 2;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.brush_size * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const endIndex = Math.min(path.length, Math.ceil(progress * path.length));
      for (let i = 0; i < endIndex; i++) {
        const p = path[i];
        const x = offsetX + p.x * scale;
        const y = offsetY + p.y * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [metadata]
  );

  const runAnimation = useCallback(() => {
    if (!metadata?.strokes?.length || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const strokes = [...metadata.strokes].sort((a, b) => a.stroke_number - b.stroke_number);
    let strokeIndex = 0;
    let strokeStartTime = performance.now();

    const clear = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    };

    let lastDisplayedIndex = -1;
    const tick = (now: number) => {
      const stroke = strokes[strokeIndex];
      if (!stroke) {
        setCurrentStrokeIndex(strokes.length);
        return;
      }
      if (strokeIndex + 1 !== lastDisplayedIndex) {
        lastDisplayedIndex = strokeIndex + 1;
        setCurrentStrokeIndex(lastDisplayedIndex);
      }
      const elapsed = now - strokeStartTime;
      const progress = Math.min(1, elapsed / stroke.duration_ms);
      clear();
      for (let i = 0; i < strokeIndex; i++) {
        drawStrokeProgress(ctx, strokes[i], 1);
      }
      drawStrokeProgress(ctx, stroke, progress);

      if (progress >= 1) {
        strokeIndex += 1;
        strokeStartTime = now;
        if (strokeIndex >= strokes.length) {
          setCurrentStrokeIndex(strokes.length);
          return;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };

    clear();
    setCurrentStrokeIndex(0);
    strokeStartTime = performance.now();
    animRef.current = requestAnimationFrame(tick);
  }, [metadata, drawStrokeProgress]);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (!metadata?.strokes?.length || !canvasRef.current) return;
    runAnimation();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [replayKey, metadata?.strokes?.length, runAnimation]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleReplay = useCallback(() => {
    onReplay?.();
  }, [onReplay]);

  const strokeCount = metadata?.stroke_count ?? 0;
  const hasMetadata = metadata != null && strokeCount > 0;

  return (
    <div className="stroke-order-animation">
      {hasMetadata && (
        <div className="stroke-order-canvas-wrap">
          <p className="stroke-order-label">
            Strokes in order: {currentStrokeIndex} of {strokeCount}
          </p>
          <canvas
            ref={canvasRef}
            width={DISPLAY_SIZE}
            height={DISPLAY_SIZE}
            className="stroke-order-canvas"
            style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
            aria-hidden="true"
          />
        </div>
      )}
      {loading && metadataUrl && <p className="stroke-order-loading">Loading stroke data…</p>}
      {hasMetadata && (
        <button type="button" className="btn btn-animate" onClick={handleReplay}>
          Replay
        </button>
      )}
    </div>
  );
}
