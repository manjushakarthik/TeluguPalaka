export interface AchuluLetter {
  id: string;
  symbol: string;
  name: string;
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
