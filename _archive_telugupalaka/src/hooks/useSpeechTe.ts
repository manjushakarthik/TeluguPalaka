import { useCallback, useState, useRef, useEffect } from 'react';

const AUDIO_BASE = '/audio';

/** Get the best available voice: Telugu if present, otherwise default */
function getVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const telugu = voices.find((v) => v.lang.startsWith('te'));
  return telugu ?? voices.find((v) => v.default) ?? voices[0] ?? null;
}

export function useSpeechTe() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voicesReady = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const onVoicesChanged = () => {
      window.speechSynthesis.getVoices();
      voicesReady.current = true;
    };
    if (window.speechSynthesis.getVoices().length > 0) voicesReady.current = true;
    window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakWithTTS = useCallback((text: string, fallbackText?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const voice = getVoice();
    const hasTelugu = voice?.lang.startsWith('te') ?? false;
    const textToSpeak = hasTelugu ? text : (fallbackText ?? text);
    const u = new SpeechSynthesisUtterance(textToSpeak);
    u.rate = 0.85;
    u.volume = 1;
    if (voice) u.voice = voice;
    if (hasTelugu) u.lang = 'te';
    u.onstart = () => setIsPlaying(true);
    u.onend = () => setIsPlaying(false);
    u.onerror = () => {
      setIsPlaying(false);
      setError('Could not play sound.');
    };
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    (letterIdOrText: string, text?: string, fallbackText?: string) => {
      setError(null);
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Call with (letterId, text, fallbackText) – try pre-recorded first
      const letterId = text !== undefined ? letterIdOrText : undefined;
      const actualText = text !== undefined ? text : letterIdOrText;
      const actualFallback = text !== undefined ? fallbackText : undefined;

      if (letterId) {
        const extensions = ['mp3', 'wav'];
        let tried = 0;
        const tryNext = () => {
          if (tried >= extensions.length) {
            speakWithTTS(actualText, actualFallback);
            return;
          }
          const ext = extensions[tried++];
          const src = `${AUDIO_BASE}/${letterId}.${ext}`;
          const audio = new Audio(src);
          audioRef.current = audio;
          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            audioRef.current = null;
          };
          audio.onerror = () => {
            audioRef.current = null;
            tryNext();
          };
          audio.play().catch(() => tryNext());
        };
        tryNext();
        return;
      }

      speakWithTTS(actualText, actualFallback);
    },
    [speakWithTTS]
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, error };
}
