export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

/** Esquema efetivo: a escolha do usuário, ou o do sistema quando está em "Sistema". */
export function resolveScheme(mode: ThemeMode, system: string | null | undefined): Scheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
