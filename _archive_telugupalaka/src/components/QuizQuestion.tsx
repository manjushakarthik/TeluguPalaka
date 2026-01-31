import { useState, useEffect, useMemo } from 'react';
import type { AchuluLetter } from '../data/achulu';
import { getQuizOptions } from '../data/achulu';
import { useSpeechTe } from '../hooks/useSpeechTe';
import { SoundButton } from './SoundButton';

interface QuizQuestionProps {
  correctLetter: AchuluLetter;
  onNext?: () => void;
  onBack?: () => void;
  inline?: boolean;
}

export function QuizQuestion({ correctLetter, onNext, onBack, inline = false }: QuizQuestionProps) {
  const options = useMemo(() => getQuizOptions(correctLetter), [correctLetter]);
  const [selected, setSelected] = useState<AchuluLetter | null>(null);
  const [correct, setCorrect] = useState<AchuluLetter | null>(null);
  const { speak, isPlaying, error } = useSpeechTe();

  useEffect(() => {
    setSelected(null);
    setCorrect(correctLetter);
  }, [correctLetter]);

  const handleSelect = (letter: AchuluLetter) => {
    if (selected != null) return;
    setSelected(letter);
    setCorrect(correctLetter);
  };

  return (
    <div className={inline ? 'quiz-question-inline' : ''} role="group" aria-label="Quiz question">
      <SoundButton letter={correctLetter} onPlay={speak} isPlaying={isPlaying} error={error} disabled={selected != null} />
      <div className="quiz-options" role="listbox" aria-label="Choose the letter you heard">
        {options.map((letter) => {
          const isChosen = selected?.id === letter.id;
          const showRight = correct != null && letter.id === correct.id;
          const showWrong = isChosen && !showRight;
          let stateClass = '';
          if (selected != null) {
            if (showRight) stateClass = 'option-correct';
            else if (showWrong) stateClass = 'option-wrong';
          }
          return (
            <button
              key={letter.id}
              type="button"
              className={`quiz-option ${stateClass}`}
              onClick={() => handleSelect(letter)}
              disabled={selected != null}
              role="option"
              aria-selected={isChosen}
              aria-label={`Option: ${letter.symbol}, ${letter.name}`}
            >
              <span className="option-symbol">{letter.symbol}</span>
            </button>
          );
        })}
      </div>
      {selected != null && (
        <div className="quiz-feedback" role="status">
          {selected.id === correct?.id ? (
            <p className="feedback correct">Correct! Well done.</p>
          ) : (
            <p className="feedback wrong">Not quite. The correct letter is {correct?.symbol}.</p>
          )}
          {inline && onBack && (
            <button type="button" className="next-button" onClick={onBack}>Back to practice</button>
          )}
          {!inline && onNext && (
            <button type="button" className="next-button" onClick={onNext}>Next</button>
          )}
        </div>
      )}
    </div>
  );
}
