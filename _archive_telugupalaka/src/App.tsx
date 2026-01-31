import { useState } from 'react';
import { LetterList } from './components/LetterList';
import { TracingView } from './components/TracingView';
import { QuizView } from './components/QuizView';
import { useProgress } from './hooks/useProgress';
import type { AchuluLetter } from './data/achulu';
import { ACHULU } from './data/achulu';
import './App.css';

type Mode = 'learn' | 'quiz';

function App() {
  const [mode, setMode] = useState<Mode>('learn');
  const [tracingLetter, setTracingLetter] = useState<AchuluLetter | null>(null);
  const { practicedIds, practicedCount, markPracticed, getPracticeCount } = useProgress();

  const currentIndex = tracingLetter ? ACHULU.findIndex((l) => l.id === tracingLetter.id) : -1;
  const onPrev = currentIndex > 0 ? () => setTracingLetter(ACHULU[currentIndex - 1]) : undefined;
  const onNext = currentIndex >= 0 && currentIndex < ACHULU.length - 1 ? () => setTracingLetter(ACHULU[currentIndex + 1]) : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <h1>TeluguPalaka</h1>
        <p className="tagline">Learn Telugu vowels (అచ్చులు)</p>
        <nav className="mode-tabs" role="tablist" aria-label="App mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'learn'}
            aria-controls="panel-learn"
            id="tab-learn"
            className={mode === 'learn' ? 'tab active' : 'tab'}
            onClick={() => { setMode('learn'); setTracingLetter(null); }}
          >
            Learn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quiz'}
            aria-controls="panel-quiz"
            id="tab-quiz"
            className={mode === 'quiz' ? 'tab active' : 'tab'}
            onClick={() => setMode('quiz')}
          >
            Quiz
          </button>
        </nav>
      </header>
      <main className="app-main">
        {mode === 'learn' && !tracingLetter && (
          <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn">
            <LetterList onSelect={setTracingLetter} practicedIds={practicedIds} practicedCount={practicedCount} />
          </div>
        )}
        {mode === 'learn' && tracingLetter && (
          <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn">
            <TracingView
              letter={tracingLetter}
              onBack={() => setTracingLetter(null)}
              onPrev={onPrev}
              onNext={onNext}
              onMarkPracticed={markPracticed}
              getPracticeCount={getPracticeCount}
            />
          </div>
        )}
        {mode === 'quiz' && (
          <div id="panel-quiz" role="tabpanel" aria-labelledby="tab-quiz">
            <QuizView />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
