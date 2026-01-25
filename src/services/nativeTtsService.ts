// Native TTS Service with Global Audio Control
// Uses browser's native speech synthesis with exclusive control

import { stopAllAudio } from './audioManager';

/**
 * Clean text for TTS (remove emojis and formatting)
 */
function cleanTextForTts(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\*\*/g, '')
    .replace(/💸|💰|📊|📈|📉|📅|📌|🏆|😤|😒|🤡|😱|😭|🔥|💀|🎉|🙏|💪|💵|🚨|😐|💔|😩|🌪️|☕|🍕|🏥|🚲|🌉|😰|🎊|💳|🙄|👀|✍️|🤔|😅/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

/**
 * Stop any ongoing native speech
 */
export function stopNativeSpeaking(): void {
  stopAllAudio();
}

/**
 * Speak text using native browser speech synthesis with exclusive control
 * Returns a promise that resolves when speech is finished or fails
 */
export function speakNative(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Native TTS: Speech synthesis not supported');
      resolve();
      return;
    }

    const cleanText = cleanTextForTts(text);
    if (!cleanText) {
      console.log('Native TTS: No text to speak after cleaning');
      resolve();
      return;
    }

    // Stop any current audio before starting new speech
    stopAllAudio();

    // Cancel any ongoing speech and start fresh
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const startSpeaking = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = [
        'Microsoft Daniel',
        'Google português do Brasil',
        'Daniel',
        'Luciana',
        'Heloisa'
      ];

      let selectedVoice = null;
      for (const preferred of preferredVoices) {
        selectedVoice = voices.find(v =>
          (v.name.includes(preferred) || v.voiceURI.includes(preferred)) &&
          (v.lang.startsWith('pt'))
        );
        if (selectedVoice) break;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        console.log('Native TTS: Started speaking');
      };

      utterance.onend = () => {
        console.log('Native TTS: Finished speaking');
        resolve();
      };

      utterance.onerror = (e) => {
        // Only log critical errors
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('Native TTS: Error', e.error);
        }
        resolve(); // Resolve anyway to not block the app
      };

      window.speechSynthesis.speak(utterance);
      console.log('Native TTS: Speaking text:', cleanText.substring(0, 50) + '...');
    };

    // Chrome and some browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null; // Prevent multiple triggers
        startSpeaking();
      };
    } else {
      startSpeaking();
    }

    // Safety timeout to resolve even if speech synthesis hangs
    setTimeout(resolve, 15000);
  });
}