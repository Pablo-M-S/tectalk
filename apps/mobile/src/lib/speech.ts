import * as Speech from 'expo-speech';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { Language } from '@/api/types';

const AUTO_KEY = 'tectalk.speech.auto';

const VOICE_LOCALE: Record<Language, string> = {
  PT: 'pt-BR',
  EN: 'en-US',
  ES: 'es-ES',
  FR: 'fr-FR',
  ZH: 'zh-CN',
  JA: 'ja-JP',
};

const RATE = { normal: 0.92, slow: 0.55 } as const;

interface SpeechState {
  autoPlay: boolean;
  setAutoPlay: (enabled: boolean) => void;
}

export const useSpeech = create<SpeechState>((set) => ({
  autoPlay: true,
  setAutoPlay: (autoPlay) => {
    set({ autoPlay });
    SecureStore.setItemAsync(AUTO_KEY, autoPlay ? '1' : '0').catch(() => {});
  },
}));

/** Lê a preferência de leitura automática. Falhas aqui nunca devem quebrar o app. */
export async function initSpeech(): Promise<void> {
  const saved = await SecureStore.getItemAsync(AUTO_KEY).catch(() => null);
  if (saved === '0') useSpeech.setState({ autoPlay: false });
}

export type SpeechPace = keyof typeof RATE;

/** Lê o texto em voz alta no idioma estudado, interrompendo qualquer leitura em andamento. */
export function speak(text: string, pace: SpeechPace = 'normal', language: Language = 'EN'): void {
  const value = text.trim();
  if (!value) return;
  try {
    Speech.stop();
    Speech.speak(value, { language: VOICE_LOCALE[language], rate: RATE[pace], pitch: 1 });
  } catch {
    // Sem voz disponível, o app segue funcionando em silêncio.
  }
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    // ignora
  }
}
