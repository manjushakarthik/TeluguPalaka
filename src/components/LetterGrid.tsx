import type { AchuluLetter } from '../data/achulu';
import { ACHULU } from '../data/achulu';

interface LetterGridProps {
  onSelect: (letter: AchuluLetter) => void;
}

export function LetterGrid({ onSelect }: LetterGridProps) {
  return (
    <section className="letter-grid-section" aria-label="Select letter to practice">
      <h2 className="letter-grid-title">Select letter to practice</h2>
      <p className="letter-grid-subtitle">Telugu vowels (అచ్చులు)</p>
      <div className="letter-grid" role="list">
        {ACHULU.map((letter) => (
          <button
            key={letter.id}
            type="button"
            className="letter-tile"
            onClick={() => onSelect(letter)}
            role="listitem"
            aria-label={`Practice ${letter.symbol}, ${letter.name}`}
          >
            <span className="letter-symbol">{letter.symbol}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
