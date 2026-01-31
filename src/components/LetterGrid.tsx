import type { AchuluLetter } from '../data/achulu';
import { ACHULU } from '../data/achulu';

interface LetterGridProps {
  selectedLetter: AchuluLetter | null;
  onSelect: (letter: AchuluLetter) => void;
}

export function LetterGrid({ selectedLetter, onSelect }: LetterGridProps) {
  return (
    <section className="letter-grid-section" aria-label="Select letter to practice">
      <div className="letter-grid-header">
        <h2 className="letter-grid-title">Choose a letter to practice</h2>
        <p className="letter-grid-subtitle">
          Telugu vowels — <span className="telugu-text">అచ్చులు</span>
        </p>
      </div>
      <div className="letter-grid" role="list">
        {ACHULU.map((letter) => (
          <button
            key={letter.id}
            type="button"
            className={`letter-tile ${selectedLetter?.id === letter.id ? 'letter-tile-selected' : ''}`}
            onClick={() => onSelect(letter)}
            role="listitem"
            aria-label={`Practice ${letter.symbol}, pronounced ${letter.name}`}
            aria-current={selectedLetter?.id === letter.id ? 'true' : undefined}
          >
            <span className="letter-symbol">{letter.symbol}</span>
            <span className="letter-name">{letter.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
