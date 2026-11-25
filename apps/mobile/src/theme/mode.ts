import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'tectalk.theme';

const isMode = (value: string | null): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

/** Força o esquema de cores do app (inclusive componentes nativos); `null` volta a seguir o sistema. */
const apply = (mode: ThemeMode) => Appearance.setColorScheme(mode === 'system' ? null : mode);

interface ThemeModeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeMode = create<ThemeModeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode });
    apply(mode);
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {});
  },
}));

export async function initTheme(): Promise<void> {
  const saved = await SecureStore.getItemAsync(THEME_KEY).catch(() => null);
  if (isMode(saved)) {
    useThemeMode.setState({ mode: saved });
    apply(saved);
  }
}
