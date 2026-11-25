import type { LocaleView, TermView } from '../src/content/exercise.factory';

/** Gerador pseudoaleatório determinístico (LCG), para testes reproduzíveis. */
export function seeded(seed = 42): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const locale = (text: string, extra: Partial<LocaleView> = {}): LocaleView => ({
  text,
  definition: `Definição de ${text}`,
  informalForms: [],
  ipa: null,
  usageNote: null,
  collocations: [],
  audioUrl: null,
  audioReady: false,
  ...extra,
});

interface TermOptions {
  informal?: string[];
  examples?: { sentence: string; answer: string }[];
  parts?: { segment: string; meaning: string }[];
}

export function makeTerm(id: string, source: string, target: string, options: TermOptions = {}): TermView {
  return {
    id,
    source: locale(source),
    target: locale(target, { informalForms: options.informal ?? [], usageNote: `Nota sobre ${target}` }),
    examples: options.examples ?? [],
    parts: options.parts ?? [],
  };
}

export function makePool(): TermView[] {
  return [
    makeTerm('t1', 'átrio', 'atrium', {
      examples: [
        { sentence: 'The right atrium receives deoxygenated blood from the vena cava.', answer: 'atrium' },
        { sentence: 'The echocardiogram showed a dilated left atrium.', answer: 'atrium' },
      ],
    }),
    makeTerm('t2', 'arritmia', 'arrhythmia', {
      informal: ['irregular heartbeat'],
      examples: [{ sentence: 'Cardiac arrhythmia was ruled out after monitoring.', answer: 'arrhythmia' }],
      parts: [
        { segment: 'ar', meaning: 'sem' },
        { segment: 'rhythm', meaning: 'ritmo' },
        { segment: 'ia', meaning: 'condição' },
      ],
    }),
    makeTerm('t3', 'taquicardia', 'tachycardia', {
      informal: ['racing heart'],
      examples: [{ sentence: 'Sinus tachycardia was noted.', answer: 'tachycardia' }],
      parts: [
        { segment: 'tachy', meaning: 'rápido' },
        { segment: 'cardia', meaning: 'coração' },
      ],
    }),
    makeTerm('t4', 'bradicardia', 'bradycardia', {
      informal: ['slow heartbeat'],
      examples: [{ sentence: 'Beta-blockers may induce symptomatic bradycardia in elderly patients.', answer: 'bradycardia' }],
      parts: [
        { segment: 'brady', meaning: 'lento' },
        { segment: 'cardia', meaning: 'coração' },
      ],
    }),
    makeTerm('t5', 'hipertensão', 'hypertension', {
      informal: ['high blood pressure'],
      examples: [{ sentence: 'The patient has poorly controlled hypertension.', answer: 'hypertension' }],
    }),
    makeTerm('t6', 'aorta', 'aorta'),
  ];
}
