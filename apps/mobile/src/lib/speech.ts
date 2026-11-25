import { Linking, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { useAuth } from '@/auth/store';
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

/** Frase de teste por idioma, no registro profissional que o app ensina. */
export const SAMPLE_SENTENCE: Record<Language, string> = {
  PT: 'Revise o resumo de alta antes do procedimento.',
  EN: 'Please review the discharge summary before the procedure.',
  ES: 'Revise el resumen de alta antes del procedimiento.',
  FR: 'Veuillez relire le compte rendu de sortie avant la procédure.',
  ZH: '请在手术前查看出院小结。',
  JA: '処置の前に退院サマリーを確認してください。',
};

const RATE = { normal: 0.92, slow: 0.55 } as const;
export type SpeechPace = keyof typeof RATE;

type Installed = Partial<Record<Language, boolean>>;

interface SpeechState {
  autoPlay: boolean;
  setAutoPlay: (enabled: boolean) => void;
  /** Se o aparelho tem alguma voz de cada idioma. Ausente = ainda não verificado. */
  installed: Installed;
}

export const useSpeech = create<SpeechState>((set) => ({
  autoPlay: true,
  installed: {},
  setAutoPlay: (autoPlay) => {
    set({ autoPlay });
    SecureStore.setItemAsync(AUTO_KEY, autoPlay ? '1' : '0').catch(() => {});
  },
}));

const normalize = (value: string) => value.toLowerCase().replace('_', '-');

let voices: Speech.Voice[] | null = null;
const voiceCache = new Map<string, string | null>();

async function loadVoices(force = false): Promise<Speech.Voice[]> {
  if (voices && !force) return voices;
  let loaded: Speech.Voice[] = [];
  try {
    loaded = await Speech.getAvailableVoicesAsync();
  } catch {
    loaded = [];
  }
  voices = loaded;
  voiceCache.clear();
  return loaded;
}

/** Escolhe a melhor voz instalada para o idioma: prefere o sotaque exato e a qualidade alta. */
async function pickVoice(language: Language): Promise<string | null> {
  const locale = VOICE_LOCALE[language];
  if (voiceCache.has(locale)) return voiceCache.get(locale) ?? null;
  const prefix = locale.slice(0, 2);
  const ranked = (await loadVoices())
    .filter((voice) => normalize(voice.language).startsWith(prefix))
    .map((voice) => ({
      id: voice.identifier,
      score:
        (normalize(voice.language) === normalize(locale) ? 4 : 0) +
        (voice.quality === Speech.VoiceQuality.Enhanced ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  const chosen = ranked[0]?.id ?? null;
  voiceCache.set(locale, chosen);
  return chosen;
}

/** Confere, para todos os idiomas do app, quais têm voz instalada no aparelho. */
export async function refreshVoices(): Promise<Installed> {
  await loadVoices(true);
  const entries = await Promise.all(
    (Object.keys(VOICE_LOCALE) as Language[]).map(async (language) => [language, (await pickVoice(language)) !== null] as const),
  );
  const installed = Object.fromEntries(entries) as Installed;
  useSpeech.setState({ installed });
  return installed;
}

/** Lê a preferência de leitura automática e verifica as vozes. Nunca deve quebrar o app. */
export async function initSpeech(): Promise<void> {
  const saved = await SecureStore.getItemAsync(AUTO_KEY).catch(() => null);
  if (saved === '0') useSpeech.setState({ autoPlay: false });
  await refreshVoices();
}

/** Idioma que a pessoa estuda, para que cada botão leia na língua certa. */
export const studiedLanguage = (): Language => useAuth.getState().user?.targetLanguage ?? 'EN';

/** Lê o texto em voz alta, interrompendo qualquer leitura em andamento. */
export function speak(text: string, pace: SpeechPace = 'normal', language: Language = studiedLanguage()): void {
  const value = text.trim();
  if (!value) return;
  void pickVoice(language).then((voice) => {
    try {
      Speech.stop();
      Speech.speak(value, { language: VOICE_LOCALE[language], voice: voice ?? undefined, rate: RATE[pace], pitch: 1 });
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

/** Abre as configurações de voz do Android, onde se baixa o pacote do idioma. */
export function openVoiceSettings(): void {
  if (Platform.OS === 'android') {
    Linking.sendIntent('com.android.settings.TTS_SETTINGS').catch(() => void Linking.openSettings());
  } else {
    void Linking.openSettings();
  }
}
