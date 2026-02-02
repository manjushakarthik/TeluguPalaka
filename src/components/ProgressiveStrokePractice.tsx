import { useRef, useEffect, useCallback, useState } from 'react';
import type { CharacterAnimationMetadata } from '../types/strokeMetadata';
import { fetchStrokeMetadata } from '../types/strokeMetadata';
import { strokeToSvgPath } from '../utils/strokeToSvg';
import { strokeMatchScore, STROKE_MATCH_THRESHOLD } from '../utils/strokeValidation';

interface ProgressiveStrokePracticeProps {
  metadataUrl: string;
  letterSize: number;
  strokeWidth: number;
  strokeColor: string;
  onComplete?: () => void;
  onProgress?: (completedStrokes: number, totalStrokes: number) => void;
}

export function ProgressiveStrokePractice({
  metadataUrl,
  letterSize,
  strokeWidth,
  strokeColor,
  onComplete,
  onProgress,
}: ProgressiveStrokePracticeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [metadata, setMetadata] = useState<CharacterAnimationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStrokeNumber, setCurrentStrokeNumber] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapeWarning, setShapeWarning] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    setLoading(true);
    fetchStrokeMetadata(metadataUrl).then((data) => {
      setMetadata(data ?? null);
      setLoading(false);
      if (data?.stroke_count) {
        onProgress?.(0, data.stroke_count);
      }
    });
  }, [metadataUrl]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = letterSize * dpr;
    el.height = letterSize * dpr;
    el.style.width = `${letterSize}px`;
    el.style.height = `${letterSize}px`;
    const ctx = el.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, [letterSize]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const clampedX = Math.max(0, Math.min(letterSize, x));
    const clampedY = Math.max(0, Math.min(letterSize, y));
    return { x: clampedX, y: clampedY, wasOutside: x !== clampedX || y !== clampedY };
  }, [letterSize]);

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setShapeWarning(null);
      const p = getPoint(e);
      if (p && !('wasOutside' in p && p.wasOutside)) {
        lastPos.current = { x: p.x, y: p.y };
        currentStrokeRef.current = [{ x: p.x, y: p.y }];
        setIsDrawing(true);
      }
    },
    [getPoint]
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !canvasRef.current) return;
      const p = getPoint(e);
      if (!p || !lastPos.current) return;
      currentStrokeRef.current.push({ x: p.x, y: p.y });
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPos.current = { x: p.x, y: p.y };
    },
    [isDrawing, getPoint, strokeColor, strokeWidth]
  );

  const clearCanvas = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.restore();
  }, []);

  const endDraw = useCallback(() => {
    if (currentStrokeRef.current.length < 3 || !metadata) {
      setIsDrawing(false);
      lastPos.current = null;
      return;
    }

    const sortedStrokes = [...metadata.strokes].sort((a, b) => a.stroke_number - b.stroke_number);
    const currentStroke = sortedStrokes.find((s) => s.stroke_number === currentStrokeNumber);
    if (!currentStroke?.path?.length) {
      setIsDrawing(false);
      lastPos.current = null;
      return;
    }

    const score = strokeMatchScore(
      currentStrokeRef.current,
      currentStroke.path,
      metadata.canvas_width,
      metadata.canvas_height,
      letterSize
    );

    if (score < STROKE_MATCH_THRESHOLD) {
      setShapeWarning('Shape doesn\'t match. Try again.');
      clearCanvas();
      currentStrokeRef.current = [];
      setIsDrawing(false);
      lastPos.current = null;
      return;
    }

    setShapeWarning(null);
    clearCanvas();
    setCurrentStrokeNumber((n) => {
      const next = n + 1;
      const completed = n;
      onProgress?.(completed, metadata.stroke_count);
      if (next > metadata.stroke_count) onComplete?.();
      return next;
    });
    currentStrokeRef.current = [];
    setIsDrawing(false);
    lastPos.current = null;
  }, [metadata, currentStrokeNumber, letterSize, clearCanvas, onComplete, onProgress]);

  const restart = useCallback(() => {
    setShapeWarning(null);
    clearCanvas();
    setCurrentStrokeNumber(1);
    onProgress?.(0, metadata?.stroke_count ?? 0);
  }, [clearCanvas, metadata?.stroke_count, onProgress]);

  if (loading) {
    return <p className="progressive-loading">Loading stroke data…</p>;
  }

  if (!metadata?.strokes?.length) {
    return <p className="progressive-error">No stroke data available.</p>;
  }

  const sortedStrokes = [...metadata.strokes].sort((a, b) => a.stroke_number - b.stroke_number);
  const currentStroke = sortedStrokes.find((s) => s.stroke_number === currentStrokeNumber);
  const isComplete = currentStrokeNumber > metadata.stroke_count;

  return (
    <div className="progressive-stroke-practice">
      {isComplete && (
        <div className="progressive-header">
          <p className="progressive-title">
            <span className="progressive-complete">✓ Complete!</span>
          </p>
        </div>
      )}

      <div
        className="progressive-area"
        ref={containerRef}
        style={{ width: letterSize, height: letterSize }}
      >
        {!isComplete && (
          <span
            className="progressive-stroke-badge"
            aria-hidden="true"
          >
            {currentStrokeNumber}<span className="progressive-stroke-badge-of">/{metadata.stroke_count}</span>
          </span>
        )}
        <svg
          className="progressive-svg"
          viewBox={`0 0 ${letterSize} ${letterSize}`}
          style={{ width: letterSize, height: letterSize }}
          aria-hidden="true"
        >
          {isComplete ? (
            /* Show all strokes solid when complete */
            sortedStrokes.map((stroke) => (
              <path
                key={stroke.stroke_number}
                d={strokeToSvgPath(stroke, metadata.canvas_width, metadata.canvas_height, letterSize)}
                fill="none"
                stroke="#ffffff"
                strokeWidth={Math.max(3, stroke.brush_size * (letterSize / metadata.canvas_width))}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))
          ) : (
            <>
              {/* Show completed strokes as they should look (solid white) */}
              {sortedStrokes
                .filter((s) => s.stroke_number < currentStrokeNumber)
                .map((stroke) => (
                  <path
                    key={stroke.stroke_number}
                    d={strokeToSvgPath(stroke, metadata.canvas_width, metadata.canvas_height, letterSize)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={Math.max(3, stroke.brush_size * (letterSize / metadata.canvas_width))}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              
              {/* Show current stroke (dotted) */}
              {currentStroke && (
                <path
                  d={strokeToSvgPath(currentStroke, metadata.canvas_width, metadata.canvas_height, letterSize)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={Math.max(3, currentStroke.brush_size * (letterSize / metadata.canvas_width))}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 6"
                  opacity="0.7"
                />
              )}
            </>
          )}
        </svg>
        <canvas
          ref={canvasRef}
          className="progressive-canvas"
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          aria-label={`Trace stroke ${currentStrokeNumber}`}
        />
      </div>

      {shapeWarning && (
        <p className="progressive-warning" role="alert">
          {shapeWarning}
        </p>
      )}

      <div className="progressive-controls">
        {isComplete ? (
          <button type="button" className="btn btn-primary" onClick={restart}>
            Repeat
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={clearCanvas}>
            Clear
          </button>
        )}
      </div>

      <p className="progressive-hint">
        {isComplete
          ? 'Great job! Practice again to improve your muscle memory.'
          : 'Trace the dotted stroke. When you finish, the correct stroke appears and the next one is shown.'}
      </p>
    </div>
  );
}
