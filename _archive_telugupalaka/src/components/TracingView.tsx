import { useRef, useEffect, useCallback, useState } from 'react';
import type { AchuluLetter } from '../data/achulu';
import { useSpeechTe } from '../hooks/useSpeechTe';
import { QuizQuestion } from './QuizQuestion';
import { LetterFormationAnimation } from './LetterFormationAnimation';

interface TracingViewProps {
  letter: AchuluLetter;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onMarkPracticed?: (letterId: string) => void;
  getPracticeCount?: (letterId: string) => number;
}

type PracticeMode = 'trace' | 'fromMemory';
type FromMemoryStep = 'study' | 'writing' | 'revealed';

export function TracingView({ letter, onBack, onPrev, onNext, onMarkPracticed, getPracticeCount }: TracingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('trace');
  const [fromMemoryStep, setFromMemoryStep] = useState<FromMemoryStep>('study');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [gifReplayKey, setGifReplayKey] = useState(0);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { speak, isPlaying, error } = useSpeechTe();

  useEffect(() => setFromMemoryStep('study'), [letter.id]);

  const markAndBack = () => { if (hasDrawn) onMarkPracticed?.(letter.id); onBack(); };
  const markAndPrev = () => { if (hasDrawn) onMarkPracticed?.(letter.id); onPrev?.(); };
  const markAndNext = () => { if (hasDrawn) onMarkPracticed?.(letter.id); onNext?.(); };

  useEffect(() => {
    const t = setTimeout(() => speak(letter.id, letter.symbol, letter.name), 400);
    return () => clearTimeout(t);
  }, [letter.id, letter.symbol, letter.name, speak]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPoint(e);
    if (p) { lastPos.current = p; setIsDrawing(true); setHasDrawn(true); }
  }, [getPoint]);

  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const p = getPoint(e);
    if (!p || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPos.current = p;
  }, [isDrawing, getPoint]);

  const endDraw = useCallback(() => { setIsDrawing(false); lastPos.current = null; }, []);

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

  const goToWriting = () => { clearCanvas(); setFromMemoryStep('writing'); };
  const goToRevealed = () => setFromMemoryStep('revealed');
  const startOverFromMemory = () => { clearCanvas(); setFromMemoryStep('study'); setHasDrawn(false); };

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      const ctx = el.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [letter.id]);

  return (
    <section className="tracing-view" aria-label={`Tracing: ${letter.symbol}`}>
      <header className="tracing-header">
        <button type="button" className="nav-button" onClick={markAndBack} aria-label="Back to letter list">← Back</button>
        <span className="tracing-title">{letter.symbol} — {letter.name}</span>
        <button
          type="button"
          className="nav-button play-sound-button"
          onClick={() => speak(letter.id, letter.symbol, letter.name)}
          disabled={isPlaying}
          aria-label={`Play vowel sound: ${letter.name}`}
        >
          {isPlaying ? '🔊 …' : '🔊 Play sound'}
        </button>
        {error && <span className="sound-error-inline" role="alert">{error}</span>}
        <div className="tracing-nav">
          {onPrev && <button type="button" className="nav-button" onClick={markAndPrev} aria-label="Previous letter">← Prev</button>}
          {onNext && <button type="button" className="nav-button" onClick={markAndNext} aria-label="Next letter">Next →</button>}
        </div>
      </header>
      <div className={letter.id === 'a' ? 'tracing-split' : 'tracing-split-single'}>
        {letter.id === 'a' && (
          <div className="tracing-demo" aria-label="Animation showing how to write అ">
            <p className="tracing-demo-label">Watch stroke order</p>
            <img
              key={gifReplayKey}
              src="https://upload.wikimedia.org/wikipedia/commons/f/f4/Animation_of_hand-writing_Kannada_and_Telugu_character_%22%E0%B0%85%22.gif"
              alt="Animation of hand-writing Telugu letter అ"
              className="tracing-demo-gif"
            />
            <div className="tracing-demo-buttons">
              <button type="button" className="nav-button tracing-tool-btn" onClick={() => setGifReplayKey((k) => k + 1)} aria-label="Replay animation">
                Animate
              </button>
            </div>
            <p className="tracing-demo-attribution">
              <a href="https://commons.wikimedia.org/wiki/File:Animation_of_hand-writing_Kannada_and_Telugu_character_%22%E0%B0%85%22.gif" target="_blank" rel="noopener noreferrer">Animation</a>
              {' '}by Subhashish Panigrahi,{' '}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
            </p>
          </div>
        )}
        <div className="tracing-practice-wrap">
          {letter.id === 'a' && <p className="tracing-practice-label">Practice here</p>}
          <div className="tracing-area" ref={containerRef}>
          {(practiceMode !== 'fromMemory' || fromMemoryStep !== 'writing') && (
            <svg className={`letter-svg ${practiceMode === 'fromMemory' ? 'solid-letter' : 'dotted-letter-svg'}`} viewBox="0 0 200 200" aria-hidden="true">
              <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={practiceMode === 'fromMemory' ? 'solid-letter-text' : 'dotted-letter-text'}>
                {letter.symbol}
              </text>
            </svg>
          )}
          <canvas
            ref={canvasRef}
            className="tracing-canvas"
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
            aria-label="Drawing area to trace the letter"
          />
          </div>
          {letter.id === 'a' && (
            <div className="tracing-practice-buttons">
              <button type="button" className="nav-button tracing-tool-btn" onClick={clearCanvas} aria-label="Clear your tracing">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="tracing-actions">
        <button type="button" className="nav-button" onClick={() => setShowQuiz(true)} aria-label="Test yourself on this letter">Test yourself</button>
        <button type="button" className="nav-button" onClick={() => setShowFormation(true)} aria-label="Watch letter formation">Watch</button>
      </div>
      {showFormation && (
        <div className="formation-overlay" role="dialog" aria-label="Letter formation">
          <p className="formation-hint">Watch the letter form.</p>
          <div className="formation-container">
            <LetterFormationAnimation key={letter.id} letter={letter} duration={1500} onComplete={() => setShowFormation(false)} />
          </div>
          <button type="button" className="nav-button" onClick={() => setShowFormation(false)} aria-label="Close">Close</button>
        </div>
      )}
      {showQuiz && (
        <div className="test-yourself-panel" role="dialog" aria-label="Test yourself">
          <h3 className="test-yourself-title">Which letter did you hear?</h3>
          <QuizQuestion key={letter.id} correctLetter={letter} inline onBack={() => setShowQuiz(false)} />
        </div>
      )}
      <div className="practice-mode-toggle" role="group" aria-label="Practice mode">
        <button type="button" className={`mode-toggle-btn ${practiceMode === 'trace' ? 'active' : ''}`} onClick={() => setPracticeMode('trace')} aria-pressed={practiceMode === 'trace'}>Trace over dotted letter</button>
        <button type="button" className={`mode-toggle-btn ${practiceMode === 'fromMemory' ? 'active' : ''}`} onClick={() => setPracticeMode('fromMemory')} aria-pressed={practiceMode === 'fromMemory'}>Write from memory</button>
      </div>
      {practiceMode === 'fromMemory' && (
        <div className="from-memory-controls">
          {fromMemoryStep === 'study' && (<><p className="from-memory-hint">Study the letter, then hide it and write from memory.</p><button type="button" className="nav-button" onClick={goToWriting}>Hide letter</button></>)}
          {fromMemoryStep === 'writing' && (<><p className="from-memory-hint">Write the letter from memory.</p><button type="button" className="nav-button" onClick={goToRevealed}>Reveal letter</button></>)}
          {fromMemoryStep === 'revealed' && (<><p className="from-memory-hint">Compare your writing with the letter.</p><button type="button" className="nav-button" onClick={startOverFromMemory}>Start over</button></>)}
        </div>
      )}
      {practiceMode === 'trace' && <p className="tracing-hint">Trace over the dotted letter with your finger or mouse.</p>}
      {getPracticeCount && (
        <p className="tracing-practice-count" role="status">
          {getPracticeCount(letter.id) === 0 ? 'First time practicing this letter' : `You've practiced this letter ${getPracticeCount(letter.id)} time${getPracticeCount(letter.id) === 1 ? '' : 's'}`}
        </p>
      )}
    </section>
  );
}
