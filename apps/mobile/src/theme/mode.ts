import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { resolveScheme, type Scheme, type ThemeMode } from './scheme';

export { resolveScheme };
export type { Scheme, ThemeMode };

const THEME_KEY = 'tectalk.theme';

const isMode = (value: string | null): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

interface ThemeModeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// O tema é resolvido só em JavaScript (sem chamadas nativas): trocar de modo não pode derrubar o app.
export const useThemeMode = create<ThemeModeState>((set) => ({
  // Primeira abertura: tema claro. A escolha do usuário (inclusive "Sistema") fica salva.
  mode: 'light',
  setMode: (mode) => {
    set({ mode });
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {});
  },
}));

export async function initTheme(): Promise<void> {
  const saved = await SecureStore.getItemAsync(THEME_KEY).catch(() => null);
  if (isMode(saved)) useThemeMode.setState({ mode: saved });
}
