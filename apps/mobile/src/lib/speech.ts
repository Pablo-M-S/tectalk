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
  /** `true` quando o aparelho não tem nenhuma voz do idioma estudado instalada. */
  voiceMissing: boolean;
}

export const useSpeech = create<SpeechState>((set) => ({
  autoPlay: true,
  voiceMissing: false,
  setAutoPlay: (autoPlay) => {
    set({ autoPlay });
    SecureStore.setItemAsync(AUTO_KEY, autoPlay ? '1' : '0').catch(() => {});
  },
}));

const voiceCache = new Map<string, string | null>();

/** Escolhe a melhor voz instalada para o idioma: prefere o sotaque exato e a qualidade alta. */
async function pickVoice(locale: string): Promise<string | null> {
  if (voiceCache.has(locale)) return voiceCache.get(locale) ?? null;
  let chosen: string | null = null;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const lang = locale.slice(0, 2).toLowerCase();
    const normalize = (value: string) => value.toLowerCase().replace('_', '-');
    const ranked = voices
      .filter((voice) => normalize(voice.language).startsWith(lang))
      .map((voice) => ({
        voice,
        score:
          (normalize(voice.language) === normalize(locale) ? 4 : 0) +
          (voice.quality === Speech.VoiceQuality.Enhanced ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    chosen = ranked[0]?.voice.identifier ?? null;
  } catch {
    chosen = null;
  }
  voiceCache.set(locale, chosen);
  return chosen;
}

/** Lê a preferência de leitura automática e confere se há voz do idioma. Nunca deve quebrar o app. */
export async function initSpeech(): Promise<void> {
  const saved = await SecureStore.getItemAsync(AUTO_KEY).catch(() => null);
  if (saved === '0') useSpeech.setState({ autoPlay: false });
  const voice = await pickVoice(VOICE_LOCALE.EN);
  useSpeech.setState({ voiceMissing: voice === null });
}

export type SpeechPace = keyof typeof RATE;

/** Lê o texto em voz alta no idioma estudado, interrompendo qualquer leitura em andamento. */
export function speak(text: string, pace: SpeechPace = 'normal', language: Language = 'EN'): void {
  const value = text.trim();
  if (!value) return;
  const locale = VOICE_LOCALE[language];
  void pickVoice(locale).then((voice) => {
    try {
      Speech.stop();
      Speech.speak(value, { language: locale, voice: voice ?? undefined, rate: RATE[pace], pitch: 1 });
    } catch {
      // Sem voz disponível, o app segue funcionando em silêncio.
    }
  });
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    // ignora
  }
}
