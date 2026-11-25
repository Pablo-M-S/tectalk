import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  pair: require('../../assets/sounds/pair.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const SOUND_KEY = 'tectalk.sound';
const players: Partial<Record<SoundName, AudioPlayer>> = {};

interface SoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useSound = create<SoundState>((set) => ({
  enabled: true,
  setEnabled: (enabled) => {
    set({ enabled });
    SecureStore.setItemAsync(SOUND_KEY, enabled ? '1' : '0').catch(() => {});
  },
}));

/** Prepara o áudio e lê a preferência salva. Falhas aqui nunca devem quebrar o app. */
export async function initSound(): Promise<void> {
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      players[name] = createAudioPlayer(SOURCES[name]);
    });
    const saved = await SecureStore.getItemAsync(SOUND_KEY);
    if (saved === '0') useSound.setState({ enabled: false });
  } catch {
    // Sem áudio, o app segue funcionando em silêncio.
  }
}

export function playSound(name: SoundName): void {
  if (!useSound.getState().enabled) return;
  try {
    const player = players[name];
    if (!player) return;
    player.seekTo(0).then(() => player.play()).catch(() => {});
  } catch {
    // ignora
  }
}
