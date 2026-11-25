import { useColorScheme } from 'react-native';
import { resolveScheme, useThemeMode, type Scheme } from './mode';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Roxo do XP e dos níveis. */
  xp: string;
  xpSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
}

const light: Palette = {
  bg: '#F6F5F1',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEDE6',
  text: '#14181F',
  muted: '#5E6673',
  border: '#E2DFD6',
  primary: '#0B5D57',
  onPrimary: '#FFFFFF',
  primarySoft: '#DCEBE9',
  xp: '#7C3AED',
  xpSoft: '#E9DDFB',
  success: '#1E7F52',
  successSoft: '#DDF0E5',
  danger: '#B4400F',
  dangerSoft: '#FBE6D9',
};

const dark: Palette = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1D242E',
  text: '#E8ECF1',
  muted: '#8B95A3',
  border: '#263041',
  primary: '#4FD1C5',
  onPrimary: '#05221F',
  primarySoft: '#12302E',
  xp: '#A855F7',
  xpSoft: '#2A1A45',
  success: '#3DD68C',
  successSoft: '#12301F',
  danger: '#FB923C',
  dangerSoft: '#34200F',
};

/** Esquema de cores em uso, já considerando a escolha manual do usuário. */
export function useScheme(): Scheme {
  const system = useColorScheme();
  const mode = useThemeMode((state) => state.mode);
  return resolveScheme(mode, system);
}

export function useTheme(): Palette {
  return useScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 10, md: 14, lg: 20 } as const;
