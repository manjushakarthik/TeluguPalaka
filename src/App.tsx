import { useState, useMemo } from 'react';
import type { AchuluLetter } from './data/achulu';
import { ACHULU } from './data/achulu';
import { LetterGrid } from './components/LetterGrid';
import { PracticeView } from './components/PracticeView';

function App() {
  const [selected, setSelected] = useState<AchuluLetter | null>(null);

  const nextLetter = useMemo(() => {
    if (!selected) return null;
    const i = ACHULU.findIndex((l) => l.id === selected.id);
    return i >= 0 && i < ACHULU.length - 1 ? ACHULU[i + 1] : null;
  }, [selected]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="title-telugu">తెలుగు పలక</span>
          <span className="title-en">TeluguPalaka</span>
        </h1>
        <p className="tagline">Learn Telugu script — trace vowels (అచ్చులు)</p>
      </header>
      <main className="app-main">
        <LetterGrid selectedLetter={selected} onSelect={setSelected} />
        {selected && (
          <PracticeView
            letter={selected}
            onBack={() => setSelected(null)}
            onNext={nextLetter ? () => setSelected(nextLetter) : undefined}
            nextLetter={nextLetter}
          />
        )}
      </main>
    </div>
  );
}

export default App;
