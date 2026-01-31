import type { AchuluLetter } from '../data/achulu';

interface SoundButtonProps {
  letter: AchuluLetter;
  onPlay: (letterId: string, text: string, fallbackText?: string) => void;
  isPlaying: boolean;
  error: string | null;
  disabled?: boolean;
}

export function SoundButton({ letter, onPlay, isPlaying, error, disabled }: SoundButtonProps) {
  return (
    <div className="sound-button-wrap">
      <button
        type="button"
        className="sound-button"
        onClick={() => onPlay(letter.id, letter.symbol, letter.name)}
        disabled={disabled || isPlaying}
        aria-label={`Play vowel sound: ${letter.name}`}
      >
        {isPlaying ? '🔊 Playing…' : '🔊 Play sound'}
      </button>
      {error && <p className="sound-error" role="alert">{error}</p>}
      <p className="sound-fallback" aria-hidden="true">
        Letter: {letter.symbol} ({letter.name})
      </p>
    </div>
  );
}
