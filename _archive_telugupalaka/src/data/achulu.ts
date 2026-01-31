export interface AchuluLetter {
  id: string;
  symbol: string;
  name: string; // romanized, for TTS and aria-labels
}

/** Telugu vowels (achulu) – 16 letters */
export const ACHULU: AchuluLetter[] = [
  { id: 'a', symbol: 'అ', name: 'a' },
  { id: 'aa', symbol: 'ఆ', name: 'aa' },
  { id: 'i', symbol: 'ఇ', name: 'i' },
  { id: 'ii', symbol: 'ఈ', name: 'ii' },
  { id: 'u', symbol: 'ఉ', name: 'u' },
  { id: 'uu', symbol: 'ఊ', name: 'uu' },
  { id: 'ru', symbol: 'ఋ', name: 'ru' },
  { id: 'ruu', symbol: 'ౠ', name: 'ruu' },
  { id: 'e', symbol: 'ఎ', name: 'e' },
  { id: 'ee', symbol: 'ఏ', name: 'ee' },
  { id: 'ai', symbol: 'ఐ', name: 'ai' },
  { id: 'o', symbol: 'ఒ', name: 'o' },
  { id: 'oo', symbol: 'ఓ', name: 'oo' },
  { id: 'au', symbol: 'ఔ', name: 'au' },
  { id: 'am', symbol: 'అం', name: 'am' },
  { id: 'ah', symbol: 'అః', name: 'ah' },
];

export function getAchuluById(id: string): AchuluLetter | undefined {
  return ACHULU.find((l) => l.id === id);
}

export function getRandomAchulu(excludeId?: string): AchuluLetter {
  const pool = excludeId ? ACHULU.filter((l) => l.id !== excludeId) : ACHULU;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick one correct and three wrong options, shuffled */
export function getQuizOptions(correct: AchuluLetter): AchuluLetter[] {
  const wrong = ACHULU.filter((l) => l.id !== correct.id);
  const threeWrong: AchuluLetter[] = [];
  const used = new Set<number>();
  while (threeWrong.length < 3) {
    const i = Math.floor(Math.random() * wrong.length);
    if (!used.has(i)) {
      used.add(i);
      threeWrong.push(wrong[i]);
    }
  }
  const options = [correct, ...threeWrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
