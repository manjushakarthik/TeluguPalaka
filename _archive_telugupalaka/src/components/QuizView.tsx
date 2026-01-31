import { useState, useEffect, useCallback } from 'react';
import type { AchuluLetter } from '../data/achulu';
import { getRandomAchulu } from '../data/achulu';
import { QuizQuestion } from './QuizQuestion';

export function QuizView() {
  const [current, setCurrent] = useState<AchuluLetter>(() => getRandomAchulu());
  const loadNew = useCallback(() => setCurrent(getRandomAchulu()), []);
  useEffect(() => { loadNew(); }, []);

  return (
    <section className="quiz-view" aria-label="Quiz mode: hear the vowel and choose the correct letter">
      <h2>Quiz</h2>
      <p className="instruction">Listen to the vowel, then select the correct letter.</p>
      <QuizQuestion key={current.id} correctLetter={current} onNext={loadNew} inline={false} />
    </section>
  );
}
