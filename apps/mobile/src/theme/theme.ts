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
  /** Cor do texto de destaque: igual ao primary quando ele já tem contraste, mais escura onde não tem. */
  primaryText: string;
  /** Roxo do XP e dos níveis. */
  xp: string;
  xpSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
}

const light: Palette = {
  bg: '#FAF6ED',
  surface: '#FFFCF5',
  surfaceAlt: '#F2EADB',
  text: '#2A2018',
  muted: '#7A6B5E',
  border: '#E7DCC8',
  primary: '#D97757',
  onPrimary: '#FFFFFF',
  primarySoft: '#F7E1D5',
  primaryText: '#B0502B',
  xp: '#7C3AED',
  xpSoft: '#E9DDFB',
  success: '#1E7F52',
  successSoft: '#E0F0E4',
  danger: '#B3261E',
  dangerSoft: '#F9E0DC',
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
  primaryText: '#4FD1C5',
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
