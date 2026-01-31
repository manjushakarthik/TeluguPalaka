import { useState } from 'react';
import type { AchuluLetter } from './data/achulu';
import { LetterGrid } from './components/LetterGrid';
import { PracticeView } from './components/PracticeView';

function App() {
  const [selected, setSelected] = useState<AchuluLetter | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TeluguPalaka</h1>
        <p className="tagline">Learn Telugu script — trace vowels (అచ్చులు)</p>
      </header>
      <main className="app-main">
        {selected === null ? (
          <LetterGrid onSelect={setSelected} />
        ) : (
          <PracticeView letter={selected} onBack={() => setSelected(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
