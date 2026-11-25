import type { Ionicons } from '@expo/vector-icons';
import type { Language, ProficiencyLevel } from '@/api/types';

type IconName = keyof typeof Ionicons.glyphMap;

export interface ProfessionOption {
  slug: string;
  label: string;
  icon: IconName;
}

/** Catálogo de profissões. A disponibilidade vem da API (trilhas publicadas). */
export const PROFESSIONS: ProfessionOption[] = [
  { slug: 'medicina', label: 'Medicina e saúde', icon: 'medkit-outline' },
  { slug: 'programacao', label: 'Programação', icon: 'code-slash-outline' },
  { slug: 'direito', label: 'Direito', icon: 'scale-outline' },
  { slug: 'engenharia', label: 'Engenharia', icon: 'construct-outline' },
  { slug: 'construcao', label: 'Construção civil', icon: 'hammer-outline' },
  { slug: 'arquitetura', label: 'Arquitetura', icon: 'business-outline' },
  { slug: 'ciencia', label: 'Ciência', icon: 'flask-outline' },
  { slug: 'outra', label: 'Outra profissão', icon: 'ellipsis-horizontal-circle-outline' },
];

export const professionLabel = (slug: string | null | undefined): string =>
  PROFESSIONS.find((p) => p.slug === slug)?.label ?? '—';

export const LANGUAGES: { code: Language; label: string; available: boolean }[] = [
  { code: 'EN', label: 'Inglês', available: true },
  { code: 'ES', label: 'Espanhol', available: false },
  { code: 'FR', label: 'Francês', available: false },
  { code: 'ZH', label: 'Chinês', available: false },
  { code: 'JA', label: 'Japonês', available: false },
  { code: 'DE', label: 'Alemão', available: false },
];

export const languageLabel = (code: Language): string =>
  LANGUAGES.find((l) => l.code === code)?.label ?? code;

export const LEVELS: { value: ProficiencyLevel; label: string; hint: string }[] = [
  { value: 'BEGINNER', label: 'Iniciante', hint: 'Entendo pouco ou quase nada' },
  { value: 'BASIC', label: 'Básico', hint: 'Leio frases simples e textos curtos' },
  { value: 'INTERMEDIATE', label: 'Intermediário', hint: 'Leio textos da minha área com ajuda' },
  { value: 'ADVANCED', label: 'Avançado', hint: 'Leio e escrevo com facilidade' },
];

export const levelLabel = (value: ProficiencyLevel | null | undefined): string =>
  LEVELS.find((l) => l.value === value)?.label ?? '—';

export const GOALS: { minutes: number; label: string; hint: string }[] = [
  { minutes: 5, label: 'Leve', hint: '5 minutos por dia' },
  { minutes: 10, label: 'Regular', hint: '10 minutos por dia' },
  { minutes: 15, label: 'Sério', hint: '15 minutos por dia' },
  { minutes: 30, label: 'Intenso', hint: '30 minutos por dia' },
];
