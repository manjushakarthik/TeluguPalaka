import type { AchuluLetter } from '../data/achulu';
import { ACHULU } from '../data/achulu';

interface LetterListProps {
  onSelect: (letter: AchuluLetter) => void;
  practicedIds: string[];
  practicedCount: number;
}

export function LetterList({ onSelect, practicedIds, practicedCount }: LetterListProps) {
  return (
    <section className="letter-list" aria-label="Learning mode: choose a vowel to trace">
      <h2>Telugu vowels (అచ్చులు)</h2>
      <p className="instruction">Tap a letter to practice tracing.</p>
      <p className="progress-summary" role="status">
        {practicedCount} / {ACHULU.length} vowels practiced
      </p>
      <div className="letter-grid" role="list">
        {ACHULU.map((letter) => (
          <button
            key={letter.id}
            type="button"
            className={`letter-tile ${practicedIds.includes(letter.id) ? 'practiced' : ''}`}
            onClick={() => onSelect(letter)}
            role="listitem"
            aria-label={`Practice ${letter.symbol}, ${letter.name}${practicedIds.includes(letter.id) ? ', practiced' : ''}`}
          >
            <span className="letter-symbol">{letter.symbol}</span>
            {practicedIds.includes(letter.id) && (
              <span className="letter-check" aria-hidden="true">✓</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
