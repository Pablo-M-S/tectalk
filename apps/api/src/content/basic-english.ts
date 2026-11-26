/**
 * Inglês básico que acompanha os termos técnicos.
 *
 * Cada palavra tem frases-modelo curtas (3 ou 4 palavras) com `{T}`, que vira o termo técnico da
 * lição. Quem está começando entende a frase inteira, e o termo técnico segue no centro dela.
 * Toda palavra também aparece sozinha, em um exercício de significado. Nada aqui depende de profissão.
 */
export type BasicGroup = 'preposition' | 'linker' | 'time' | 'degree';

export interface BasicWord {
  word: string;
  group: BasicGroup;
  /** Significado em português. */
  pt: string;
  /** Armadilhas e uso, em português. */
  note: string;
  /** Frases curtas (até 4 palavras, `{T}` conta como uma). Vazio: a palavra só aparece no exercício de significado. */
  templates: string[];
}

const W = (
  word: string,
  group: BasicGroup,
  pt: string,
  note: string,
  templates: string[],
): BasicWord => ({ word, group, pt, note, templates });

export const BASIC_WORDS: BasicWord[] = [
  // ---- preposições
  W('without', 'preposition', 'sem', 'Without já traz a ideia de negação: não use not junto. Escreva "without any delay", nunca "without not delay".',
    ['Work without the {T}', 'Start without the {T}']),
  W('within', 'preposition', 'dentro de (um prazo ou limite)', 'Within indica limite: "within two days" é em até dois dias. Para lugar físico fechado, use inside.',
    ['Stay within the {T}', 'Keep within the {T}']),
  W('between', 'preposition', 'entre (duas coisas)', 'Between é para dois pontos de referência; para um grupo de três ou mais, prefira among.',
    ['Sit between the {T}', 'Stand between the {T}']),
  W('during', 'preposition', 'durante', 'During vem seguido de substantivo (during the meeting). Antes de uma frase com verbo, use while.',
    ['Pause during the {T}', 'Rest during the {T}']),
  W('through', 'preposition', 'por meio de, através de', 'Through é o caminho ou o meio. Não confunda com though (embora) nem com thorough (minucioso).',
    ['Walk through the {T}', 'Read through the {T}']),
  W('across', 'preposition', 'por toda a, de um lado ao outro', 'Across cobre toda a extensão: "across the company" é em toda a empresa.',
    ['Look across the {T}', 'Walk across the {T}']),
  W('against', 'preposition', 'contra, em comparação com', 'Em documentos, "check against" é conferir com um padrão: "checked against the records".',
    ['Check against the {T}', 'Lean against the {T}']),
  W('despite', 'preposition', 'apesar de', 'Despite não leva of: "despite the delay". A versão com of é in spite of.',
    ['Smile despite the {T}', 'Work despite the {T}']),
  W('until', 'preposition', 'até (que)', 'Until marca o fim de um período: "until Friday". Em frases negativas, indica o momento em que algo passa a valer.',
    ['Wait until the {T}', 'Work until the {T}']),
  W('since', 'preposition', 'desde', 'Since marca o ponto de partida (since January); for marca a duração (for six months).',
    ['Open since the {T}', 'Closed since the {T}']),
  W('after', 'preposition', 'depois de', 'After é posterior; o oposto é before. Também funciona antes de uma frase: "after we finish".',
    ['Check after the {T}', 'Rest after the {T}']),
  W('before', 'preposition', 'antes de', 'Before pode vir antes de substantivo ou de frase: "before the test", "before you start".',
    ['Check before the {T}', 'Read before the {T}']),
  W('about', 'preposition', 'sobre (assunto)', 'About é o assunto: "a question about the contract". Também significa aproximadamente: "about ten minutes".',
    ['Ask about the {T}', 'Read about the {T}']),
  // ---- conectivos
  W('because', 'linker', 'porque', 'Because é seguido de frase completa (because the risk was high). Antes de substantivo, use because of.',
    []),
  W('although', 'linker', 'embora, apesar de que', 'Although introduz uma frase completa e não leva but na mesma frase: "Although it was late, we finished".',
    []),
  W('however', 'linker', 'no entanto, porém', 'However vem entre vírgulas ou depois de ponto e vírgula. Em textos formais, é mais comum que but.',
    []),
  W('therefore', 'linker', 'portanto', 'Therefore indica consequência e é típico de textos formais. Em conversa, usa-se so.',
    []),
  W('unless', 'linker', 'a menos que', 'Unless já tem sentido negativo: "unless you approve" equivale a "if you do not approve". Não use not.',
    []),
  W('while', 'linker', 'enquanto; ao passo que', 'While liga duas ações simultâneas e também contrasta ideias: "while A is cheap, B is expensive".',
    []),
  W('whether', 'linker', 'se (dúvida entre opções)', 'Whether introduz uma dúvida ou escolha. Não confunda com weather (clima) nem com if em frases condicionais.',
    []),
  W('instead', 'linker', 'em vez disso', 'Instead sozinho fecha a ideia; antes de substantivo vira instead of: "instead of the old method".',
    ['Try the {T} instead', 'Use the {T} instead']),
  W('otherwise', 'linker', 'caso contrário; de outro modo', 'Otherwise liga a consequência de não cumprir algo: "Check it; otherwise, errors may go unnoticed".',
    []),
  W('moreover', 'linker', 'além disso', 'Moreover acrescenta um argumento mais forte e é muito formal. Em conversa, use also ou plus.',
    []),
  // ---- tempo e frequência
  W('anytime', 'time', 'a qualquer momento', 'Anytime é advérbio e se escreve junto. Como substantivo, são duas palavras: "any time of day".',
    ['Check the {T} anytime', 'Study the {T} anytime']),
  W('always', 'time', 'sempre', 'Always vem antes do verbo principal e depois do verbo to be: "we always check", "it is always ready".',
    ['Always check the {T}', 'Always read the {T}']),
  W('never', 'time', 'nunca', 'Never já é negativo: não use not junto. Escreva "we never skip", e não "we do not never skip".',
    ['Never skip the {T}', 'Never ignore the {T}']),
  W('already', 'time', 'já (em frases afirmativas)', 'Already é para o que já aconteceu, em frases afirmativas. Em perguntas e negativas, usa-se yet.',
    ['Already checked the {T}', 'Already read the {T}']),
  W('still', 'time', 'ainda (continua)', 'Still indica que algo continua: "we still need". Em negativas, indica que algo não mudou: "it still does not work".',
    ['Still learning the {T}', 'Still checking the {T}']),
  W('yet', 'time', 'ainda (não); já (em perguntas)', 'Yet fica no fim de negativas e perguntas: "we have not finished yet", "have you checked it yet?".',
    []),
  W('often', 'time', 'frequentemente', 'Often fica antes do verbo principal. Na pergunta "how often", pergunta-se a frequência.',
    ['Often check the {T}', 'Often read the {T}']),
  W('usually', 'time', 'geralmente, normalmente', 'Usually descreve o que costuma acontecer. Não confunda com actually, que significa na verdade.',
    ['Usually check the {T}', 'Usually read the {T}']),
  W('sometimes', 'time', 'às vezes', 'Sometimes pode vir no começo, no meio ou no fim da frase. Sometime (singular) é em algum momento.',
    ['Sometimes check the {T}', 'Sometimes read the {T}']),
  W('soon', 'time', 'em breve', 'Soon fica no fim ou antes do verbo: "we will call you soon". As soon as é assim que.',
    ['Check the {T} soon', 'Study the {T} soon']),
  W('later', 'time', 'mais tarde, depois', 'Later é comparativo de late e indica um momento posterior: "see you later". Latter é outra palavra (o último).',
    ['Check the {T} later', 'Study the {T} later']),
  W('recently', 'time', 'recentemente', 'Recently costuma vir com o passado simples ou o present perfect: "we recently updated".',
    ['Recently read the {T}', 'Recently checked the {T}']),
  W('again', 'time', 'de novo, outra vez', 'Again fica no fim da frase. Once again e yet again reforçam a repetição.',
    ['Check the {T} again', 'Study the {T} again']),
  // ---- quantidade e grau
  W('enough', 'degree', 'suficiente(mente)', 'Enough vem antes de substantivo (enough time) e depois de adjetivo (clear enough).',
    ['Study the {T} enough', 'Practise the {T} enough']),
  W('several', 'degree', 'vários', 'Several é mais que dois e menos que muitos; vem antes de substantivo no plural.',
    []),
  W('every', 'degree', 'todo(s), cada', 'Every leva verbo no singular: "every student needs". Everyday (junto) é adjetivo: diário.',
    ['Check every {T}', 'Study every {T}']),
  W('each', 'degree', 'cada (um)', 'Each destaca o indivíduo dentro do grupo e leva verbo no singular. Each of exige plural: "each of the teams".',
    ['Check each {T}', 'Study each {T}']),
  W('both', 'degree', 'ambos', 'Both se refere a dois e leva verbo no plural. Both... and... liga duas ideias.',
    []),
  W('either', 'degree', 'um ou outro', 'Either...or... apresenta duas opções. Em negativas, either significa também não.',
    []),
  W('another', 'degree', 'outro (mais um)', 'Another = an + other, por isso vem sempre com substantivo singular: "another example".',
    ['Study another {T}', 'Read another {T}']),
  W('only', 'degree', 'somente, apenas', 'Only fica logo antes da palavra que limita. Mudar o lugar muda o sentido da frase.',
    ['Check only the {T}', 'Study only the {T}']),
  W('also', 'degree', 'também, além disso', 'Also fica antes do verbo principal. No fim da frase, prefira too.',
    ['Also check the {T}', 'Also read the {T}']),
  W('even', 'degree', 'até mesmo, mesmo', 'Even reforça uma surpresa: "even experts make mistakes". Não confunda com even como par (número par).',
    ['Even the {T} helps', 'Even the {T} works']),
  W('almost', 'degree', 'quase', 'Almost é quase, mas não completamente: "almost finished". Nearly tem sentido parecido.',
    ['Almost finished the {T}', 'Almost checked the {T}']),
  W('too', 'degree', 'demais; também', 'Too sozinho antes de adjetivo é excessivo: "too short". No fim da frase, significa também.',
    ['Study the {T} too', 'Check the {T} too']),
  W('quite', 'degree', 'bastante, razoavelmente', 'Quite é bastante: "quite clear". No inglês americano é mais forte que no britânico.',
    []),
];

/**
 * Opções erradas das frases. Cada grupo só recebe palavras que não cabem na lacuna daquele tipo
 * de frase, para nunca haver duas respostas possíveis.
 */
const CLAUSE_WORDS = ['because', 'although', 'unless', 'whether'];
const SENTENCE_DISTRACTORS: Record<BasicGroup, string[]> = {
  preposition: [...CLAUSE_WORDS, 'several', 'each', 'every', 'another', 'both', 'either'],
  linker: [],
  time: [...CLAUSE_WORDS, 'while', 'several', 'every', 'another', 'both'],
  degree: CLAUSE_WORDS,
};

export const sentenceDistractors = (entry: BasicWord): string[] =>
  SENTENCE_DISTRACTORS[entry.group].filter((w) => w !== entry.word);

const tokens = (text: string): Set<string> =>
  new Set(text.toLowerCase().split(/[^a-zà-ú]+/).filter((t) => t.length >= 3));

/** Duas traduções que dividem uma palavra (ex.: "já") confundiriam o aluno como opções. */
export const meaningsClash = (a: BasicWord, b: BasicWord): boolean => {
  const first = tokens(a.pt);
  return [...tokens(b.pt)].some((t) => first.has(t));
};

export type Level = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

/** Parte dos exercícios dedicada ao termo técnico, por nível. O resto é inglês básico. */
const TECHNICAL_SHARE: Record<Level, number> = {
  BEGINNER: 0.5,
  BASIC: 0.6,
  INTERMEDIATE: 0.7,
  ADVANCED: 1,
};

/**
 * Parte técnica da sessão. A precisão recente em inglês básico (0 a 1, com amostra
 * suficiente) empurra o foco para os termos técnicos: quem acerta o básico não precisa dele.
 */
export function technicalShare(level: Level | null | undefined, basicAccuracy?: number): number {
  const base = level ? TECHNICAL_SHARE[level] : 1;
  if (base >= 1 || basicAccuracy === undefined || Number.isNaN(basicAccuracy)) return base;
  const gap = 1 - base;
  if (basicAccuracy >= 0.9) return base + gap * 0.5;
  if (basicAccuracy >= 0.8) return base + gap * 0.25;
  return base;
}
