import { useEffect } from 'react';
import type { AchuluLetter } from '../data/achulu';

interface LetterFormationAnimationProps {
  letter: AchuluLetter;
  onComplete?: () => void;
  duration?: number;
}

export function LetterFormationAnimation({
  letter,
  onComplete,
  duration = 1500,
}: LetterFormationAnimationProps) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), duration);
    return () => clearTimeout(t);
  }, [letter.id, duration, onComplete]);

  return (
    <div className="letter-formation-animation" aria-hidden="true">
      <svg className="formation-svg" viewBox="0 0 200 200" aria-hidden="true">
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="formation-letter-text">
          {letter.symbol}
        </text>
      </svg>
    </div>
  );
}
