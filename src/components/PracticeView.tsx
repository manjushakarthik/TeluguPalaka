import { useRef, useEffect, useCallback, useState } from 'react';
import type { AchuluLetter } from '../data/achulu';
import { getStrokeCountForLetter, getStrokeReference } from '../data/strokeReference';
import { computeStrokeOrderAccuracy } from '../data/strokeOrderAccuracy';

const LETTER_SIZE_MIN = 100;
const LETTER_SIZE_MAX = 280;
const LETTER_SIZE_DEFAULT = 180;

const STROKE_WIDTH_MIN = 4;
const STROKE_WIDTH_MAX = 24;
const STROKE_WIDTH_DEFAULT = 10;

const STROKE_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Amber', value: '#d97706' },
];

const A_ANIMATION_GIF = 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Animation_of_hand-writing_Kannada_and_Telugu_character_%22%E0%B0%85%22.gif';
/** Second vowel (ఆ) – local animation (public/animations/aa.gif) */
const AA_ANIMATION = '/animations/aa.gif';

interface PracticeViewProps {
  letter: AchuluLetter;
  onBack: () => void;
}

export function PracticeView({ letter, onBack }: PracticeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [letterSize, setLetterSize] = useState(LETTER_SIZE_DEFAULT);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH_DEFAULT);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0].value);
  const [gifKey, setGifKey] = useState(0);
  const [letterAnimKey, setLetterAnimKey] = useState(0);
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const showAnimationPanel = letter.id === 'a' || letter.id === 'aa';
  const animationSrc = letter.id === 'a' ? A_ANIMATION_GIF : letter.id === 'aa' ? AA_ANIMATION : '';

  useEffect(() => {
    setStrokes([]);
  }, [letter.id]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const p = getPoint(e);
      if (p) {
        lastPos.current = p;
        currentStrokeRef.current = [p];
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
      currentStrokeRef.current.push(p);
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
      lastPos.current = p;
    },
    [isDrawing, getPoint, strokeColor, strokeWidth]
  );

  const endDraw = useCallback(() => {
    if (currentStrokeRef.current.length > 0) {
      setStrokes((prev) => [...prev, [...currentStrokeRef.current]]);
      currentStrokeRef.current = [];
    }
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.restore();
    setStrokes([]);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const size = letterSize;
    const dpr = window.devicePixelRatio || 1;
    el.width = size * dpr;
    el.height = size * dpr;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    const ctx = el.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, [letter.id, letterSize]);

  const downloadPNG = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const size = letterSize;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    const svg = container.querySelector('.dotted-letter-svg');
    if (svg && svg instanceof SVGSVGElement) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        ctx.drawImage(canvas, 0, 0, size, size);
        const link = document.createElement('a');
        link.download = `telugu-${letter.id}-practice.png`;
        link.href = offscreen.toDataURL('image/png');
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } else {
      ctx.drawImage(canvas, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `telugu-${letter.id}-practice.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
    }
  }, [letter.id, letterSize]);

  const printWorksheet = useCallback(() => {
    const w = window.open('', '_blank');
    if (!w) return;
    const size = letterSize;
    const container = containerRef.current;
    const svg = container?.querySelector('.dotted-letter-svg');
    const svgData = svg instanceof SVGSVGElement ? new XMLSerializer().serializeToString(svg) : '';
    w.document.write(`
      <!DOCTYPE html><html><head><title>Telugu Practice - ${letter.symbol}</title>
      <style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;padding:2rem;}
      .letter{font-size:${Math.round(size * 0.7)}px;margin:1rem 0;}
      img{max-width:100%;height:auto;border:1px solid #ccc;}</style></head><body>
      <h1>Telugu Practice</h1>
      <p class="letter">${letter.symbol} (${letter.name})</p>
      <img src="${svgData ? 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))) : ''}" width="${size}" height="${size}" alt="Letter" />
      <p><small>Trace the letter above. Use "Download as PNG" in the app to save your tracing.</small></p>
      </body></html>
    `);
    w.document.close();
    w.print();
    w.close();
  }, [letter, letterSize]);

  const triggerLetterAnimation = useCallback(() => {
    setLetterAnimKey((k) => k + 1);
  }, []);

  return (
    <section className="practice-view" aria-label={`Practice ${letter.symbol}`}>
      <header className="practice-header">
        <button type="button" className="btn btn-back" onClick={onBack} aria-label="Back to letters">
          ← Back
        </button>
        <h2 className="practice-title">
          <span className="letter-large">{letter.symbol}</span>
          <span className="letter-name">"{letter.name}"</span>
        </h2>
      </header>

      <div className="customization">
        <p className="customization-title">Customize</p>
        <div className="custom-row">
          <label htmlFor="letter-size">Letter size</label>
          <input
            id="letter-size"
            type="range"
            min={LETTER_SIZE_MIN}
            max={LETTER_SIZE_MAX}
            value={letterSize}
            onChange={(e) => setLetterSize(Number(e.target.value))}
          />
          <span className="custom-value">{letterSize}px</span>
        </div>
        <div className="custom-row">
          <label htmlFor="stroke-width">Stroke width</label>
          <input
            id="stroke-width"
            type="range"
            min={STROKE_WIDTH_MIN}
            max={STROKE_WIDTH_MAX}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
          <span className="custom-value">{strokeWidth}px</span>
        </div>
        <div className="custom-row">
          <span className="custom-label">Stroke color</span>
          <div className="color-swatches">
            {STROKE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-swatch ${strokeColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setStrokeColor(c.value)}
                aria-label={c.name}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="practice-layout">
        {showAnimationPanel && animationSrc && (
          <div className="animate-panel">
            <p className="animate-label">Watch stroke order</p>
            <img
              key={gifKey}
              src={`${animationSrc}${animationSrc.includes('?') ? '&' : '?'}t=${gifKey}`}
              alt={`Animation of writing ${letter.symbol}`}
              className="animate-gif"
            />
            <button type="button" className="btn btn-animate" onClick={() => setGifKey((k) => k + 1)}>
              Replay
            </button>
            {letter.id === 'a' && (
              <p className="animate-attribution">
                <a href="https://commons.wikimedia.org/wiki/File:Animation_of_hand-writing_Kannada_and_Telugu_character_%22%E0%B0%85%22.gif" target="_blank" rel="noopener noreferrer">Animation</a> by Subhashish Panigrahi, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
              </p>
            )}
          </div>
        )}

        <div className="practice-panel">
          <p className="practice-label">Trace here</p>
          <div
            className="practice-area"
            ref={containerRef}
            style={{ width: letterSize, height: letterSize }}
          >
            <svg
              key={letterAnimKey}
              className={`dotted-letter-svg ${!showAnimationPanel && letterAnimKey > 0 ? 'dotted-letter-animate' : ''}`}
              viewBox="0 0 200 200"
              aria-hidden="true"
              style={{ width: letterSize, height: letterSize }}
            >
              <text
                x="50%"
                y="50%"
                dominantBaseline="central"
                textAnchor="middle"
                className="dotted-letter-text"
              >
                {letter.symbol}
              </text>
            </svg>
            <canvas
              ref={canvasRef}
              className="practice-canvas"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
              aria-label="Trace the letter"
            />
          </div>
          <p className="practice-hint">
            <span className="practice-hint-icon">?</span>
            Follow the dotted outline with your finger or mouse
          </p>
          <div className="practice-buttons">
            <button type="button" className="btn btn-clear" onClick={clearCanvas}>
              Clear
            </button>
            {!showAnimationPanel && (
              <button type="button" className="btn btn-animate" onClick={triggerLetterAnimation}>
                Animate letter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="progress-section" aria-live="polite">
        <p className="progress-title">Your Progress</p>
        <ul className="progress-stats">
          <li className="progress-stat">
            <span className="progress-stat-value">{strokes.length}</span>
            <span className="progress-stat-label">Strokes drawn</span>
          </li>
          <li className="progress-stat">
            <span className="progress-stat-value">
              {(() => {
                const n = getStrokeCountForLetter(letter.id);
                return n !== null ? n : '—';
              })()}
            </span>
            <span className="progress-stat-label">Expected strokes</span>
          </li>
          <li className="progress-stat">
            {(() => {
              const ref = getStrokeReference(letter.id);
              if (!ref?.strokes?.length) {
                return (
                  <>
                    <span className="progress-stat-value">—</span>
                    <span className="progress-stat-label">Accuracy</span>
                    <span className="progress-stat-hint">Coming soon</span>
                  </>
                );
              }
              const acc = computeStrokeOrderAccuracy(strokes, ref.strokes);
              const accClass = acc !== null
                ? acc >= 80 ? 'accuracy-good' : acc >= 50 ? 'accuracy-medium' : 'accuracy-low'
                : '';
              return (
                <>
                  <span className={`progress-stat-value ${accClass}`}>
                    {acc !== null ? `${acc}%` : '—'}
                  </span>
                  <span className="progress-stat-label">Accuracy</span>
                </>
              );
            })()}
          </li>
        </ul>
      </div>

      <div className="download-section">
        <p className="download-title">Export</p>
        <div className="download-buttons">
          <button type="button" className="btn btn-download" onClick={downloadPNG}>
            📥 Download PNG
          </button>
          <button type="button" className="btn btn-download" onClick={printWorksheet}>
            🖨️ Print worksheet
          </button>
        </div>
      </div>
    </section>
  );
}
