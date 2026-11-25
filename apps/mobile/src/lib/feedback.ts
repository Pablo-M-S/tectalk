import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { initSound, playSound, type SoundName } from './sounds';

const HAPTICS_KEY = 'tectalk.haptics';

interface HapticsState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useHaptics = create<HapticsState>((set) => ({
  enabled: true,
  setEnabled: (enabled) => {
    set({ enabled });
    SecureStore.setItemAsync(HAPTICS_KEY, enabled ? '1' : '0').catch(() => {});
  },
}));

const vibrate: Record<SoundName, () => Promise<void>> = {
  tap: () => Haptics.selectionAsync(),
  pair: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  burst: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  correct: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  wrong: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  complete: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

/** Prepara áudio e lê as preferências de som e vibração salvas. */
export async function initFeedback(): Promise<void> {
  await initSound();
  const saved = await SecureStore.getItemAsync(HAPTICS_KEY).catch(() => null);
  if (saved === '0') useHaptics.setState({ enabled: false });
}

/** Um único ponto para dar retorno ao usuário: som e vibração, cada um respeitando sua preferência. */
export function cue(name: SoundName): void {
  playSound(name);
  if (useHaptics.getState().enabled) vibrate[name]().catch(() => {});
}
