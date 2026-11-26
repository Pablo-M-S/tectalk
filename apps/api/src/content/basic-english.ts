/**
 * Inglês básico que acompanha os termos técnicos.
 *
 * Cada palavra tem frases-modelo com `{T}`, que vira "the <termo técnico da lição>".
 * Assim o aluno pratica as palavras do dia a dia dentro de frases profissionais, e o
 * termo técnico segue sendo o centro da frase. Nada aqui depende de profissão.
 */
export type BasicGroup = 'preposition' | 'linker' | 'time' | 'degree';

export interface BasicWord {
  word: string;
  group: BasicGroup;
  /** Significado em português. */
  pt: string;
  /** Armadilhas e uso, em português. */
  note: string;
  templates: [string, string];
}

const W = (
  word: string,
  group: BasicGroup,
  pt: string,
  note: string,
  templates: [string, string],
): BasicWord => ({ word, group, pt, note, templates });

export const BASIC_WORDS: BasicWord[] = [
  // ---- preposições
  W('without', 'preposition', 'sem', 'Without já traz a ideia de negação: não use not junto. Escreva "without any delay", nunca "without not delay".',
    ['Never approve {T} without checking the details first.', 'The team completed {T} without any delay.']),
  W('within', 'preposition', 'dentro de (um prazo ou limite)', 'Within indica limite: "within two days" é em até dois dias. Para lugar físico fechado, use inside.',
    ['Review {T} within two working days.', 'Keep {T} within the approved limits.']),
  W('between', 'preposition', 'entre (duas coisas)', 'Between é para dois pontos de referência; para um grupo de três ou mais, prefira among.',
    ['Explain the difference between {T} and the old version.', 'There was a long discussion between the experts about {T}.']),
  W('during', 'preposition', 'durante', 'During vem seguido de substantivo (during the meeting). Antes de uma frase com verbo, use while.',
    ['Check {T} during every inspection.', 'Questions about {T} came up during the meeting.']),
  W('through', 'preposition', 'por meio de, através de', 'Through é o caminho ou o meio. Não confunda com though (embora) nem com thorough (minucioso).',
    ['The manager walked us through {T} step by step.', 'We learned about {T} through daily practice.']),
  W('across', 'preposition', 'por toda a, de um lado ao outro', 'Across cobre toda a extensão: "across the company" é em toda a empresa.',
    ['The team applied {T} across all departments.', 'Notes on {T} were shared across the whole company.']),
  W('against', 'preposition', 'contra, em comparação com', 'Em documentos, "check against" é conferir com um padrão: "checked against the records".',
    ['Compare {T} against the official standard.', "The audit checked {T} against last year's records."]),
  W('despite', 'preposition', 'apesar de', 'Despite não leva of: "despite the delay". A versão com of é in spite of.',
    ['The meeting went ahead despite problems with {T}.', 'We finished on time despite changes to {T}.']),
  W('until', 'preposition', 'até (que)', 'Until marca o fim de um período: "until Friday". Em frases negativas, indica o momento em que algo passa a valer.',
    ['Do not continue with {T} until the review is complete.', 'Wait until Monday before you change {T}.']),
  W('since', 'preposition', 'desde', 'Since marca o ponto de partida (since January); for marca a duração (for six months).',
    ['We have worked on {T} since January.', 'Nothing has changed with {T} since the last audit.']),
  W('after', 'preposition', 'depois de', 'After é posterior; o oposto é before. Também funciona antes de uma frase: "after we finish".',
    ['Update {T} after every change.', 'We discussed {T} after the presentation.']),
  W('before', 'preposition', 'antes de', 'Before pode vir antes de substantivo ou de frase: "before the test", "before you start".',
    ['Read about {T} before the next class.', 'Check {T} before you submit the report.']),
  W('about', 'preposition', 'sobre (assunto)', 'About é o assunto: "a question about the contract". Também significa aproximadamente: "about ten minutes".',
    ['She asked a question about {T}.', 'Please write a short note about {T}.']),
  // ---- conectivos
  W('because', 'linker', 'porque', 'Because é seguido de frase completa (because the risk was high). Antes de substantivo, use because of.',
    ['We reviewed {T} twice because the risk was high.', 'Pay close attention to {T} because small errors matter.']),
  W('although', 'linker', 'embora, apesar de que', 'Although introduz uma frase completa e não leva but na mesma frase: "Although it was late, we finished".',
    ['Although we studied {T} carefully, we still made a mistake.', 'We approved {T} although several questions remained.']),
  W('however', 'linker', 'no entanto, porém', 'However vem entre vírgulas ou depois de ponto e vírgula. Em textos formais, é mais comum que but.',
    ['We studied {T} carefully; however, some doubts remain.', 'The plan covers {T}; however, the budget is limited.']),
  W('therefore', 'linker', 'portanto', 'Therefore indica consequência e é típico de textos formais. Em conversa, usa-se so.',
    ['The data on {T} was incomplete; therefore, we repeated the test.', 'We lacked evidence about {T}; therefore, we postponed the decision.']),
  W('unless', 'linker', 'a menos que', 'Unless já tem sentido negativo: "unless you approve" equivale a "if you do not approve". Não use not.',
    ['Do not change {T} unless your supervisor approves it.', 'We cannot start {T} unless the permit is ready.']),
  W('while', 'linker', 'enquanto; ao passo que', 'While liga duas ações simultâneas e também contrasta ideias: "while A is cheap, B is expensive".',
    ['We practised {T} while the instructor watched.', 'One group reviewed {T} while the other prepared the report.']),
  W('whether', 'linker', 'se (dúvida entre opções)', 'Whether introduz uma dúvida ou escolha. Não confunda com weather (clima) nem com if em frases condicionais.',
    ['We discussed whether to revise {T} this week.', 'The committee will decide whether to approve {T}.']),
  W('instead', 'linker', 'em vez disso', 'Instead sozinho fecha a ideia; antes de substantivo vira instead of: "instead of the old method".',
    ['We chose {T} instead of the old method.', 'He studied {T} instead of repeating the first chapter.']),
  W('otherwise', 'linker', 'caso contrário; de outro modo', 'Otherwise liga a consequência de não cumprir algo: "Check it; otherwise, errors may go unnoticed".',
    ['Check {T} carefully; otherwise, errors may go unnoticed.', 'Update {T} today; otherwise, the report will be wrong.']),
  W('moreover', 'linker', 'além disso', 'Moreover acrescenta um argumento mais forte e é muito formal. Em conversa, use also ou plus.',
    ['We reviewed {T}; moreover, we updated the records.', 'The guide explains {T}; moreover, it gives practical examples.']),
  // ---- tempo e frequência
  W('anytime', 'time', 'a qualquer momento', 'Anytime é advérbio e se escreve junto. Como substantivo, são duas palavras: "any time of day".',
    ['You can review {T} anytime, even on weekends.', 'Ask for help with {T} anytime you need it.']),
  W('always', 'time', 'sempre', 'Always vem antes do verbo principal e depois do verbo to be: "we always check", "it is always ready".',
    ['Always check {T} before you start.', 'We always record {T} in the logbook.']),
  W('never', 'time', 'nunca', 'Never já é negativo: não use not junto. Escreva "we never skip", e não "we do not never skip".',
    ['We never skip {T} during a routine check.', 'She never signs off on {T} without a second opinion.']),
  W('already', 'time', 'já (em frases afirmativas)', 'Already é para o que já aconteceu, em frases afirmativas. Em perguntas e negativas, usa-se yet.',
    ['The team has already reviewed {T}.', 'We already covered {T} in the first class.']),
  W('still', 'time', 'ainda (continua)', 'Still indica que algo continua: "we still need". Em negativas, indica que algo não mudou: "it still does not work".',
    ['We still need to review {T}.', 'Many students still confuse {T} with similar terms.']),
  W('yet', 'time', 'ainda (não); já (em perguntas)', 'Yet fica no fim de negativas e perguntas: "we have not finished yet", "have you checked it yet?".',
    ['We have not finished {T} yet.', 'Has anyone checked {T} yet?']),
  W('often', 'time', 'frequentemente', 'Often fica antes do verbo principal. Na pergunta "how often", pergunta-se a frequência.',
    ['Questions about {T} often appear in exams.', 'We often discuss {T} in team meetings.']),
  W('usually', 'time', 'geralmente, normalmente', 'Usually descreve o que costuma acontecer. Não confunda com actually, que significa na verdade.',
    ['We usually start the day by checking {T}.', 'Experts usually explain {T} with simple examples.']),
  W('sometimes', 'time', 'às vezes', 'Sometimes pode vir no começo, no meio ou no fim da frase. Sometime (singular) é em algum momento.',
    ['We sometimes revise {T} after the first draft.', 'Sometimes the notes on {T} are incomplete.']),
  W('soon', 'time', 'em breve', 'Soon fica no fim ou antes do verbo: "we will call you soon". As soon as é assim que.',
    ['We will review {T} soon.', 'The new rules on {T} will take effect soon.']),
  W('later', 'time', 'mais tarde, depois', 'Later é comparativo de late e indica um momento posterior: "see you later". Latter é outra palavra (o último).',
    ['We can discuss {T} later.', 'She promised to explain {T} later.']),
  W('recently', 'time', 'recentemente', 'Recently costuma vir com o passado simples ou o present perfect: "we recently updated".',
    ['We recently updated {T}.', 'The guide on {T} was revised recently.']),
  W('again', 'time', 'de novo, outra vez', 'Again fica no fim da frase. Once again e yet again reforçam a repetição.',
    ['Read about {T} again before the test.', 'Please explain {T} again.']),
  // ---- quantidade e grau
  W('enough', 'degree', 'suficiente(mente)', 'Enough vem antes de substantivo (enough time) e depois de adjetivo (clear enough).',
    ['We have enough examples of {T} for the lesson.', 'Is the explanation of {T} clear enough?']),
  W('several', 'degree', 'vários', 'Several é mais que dois e menos que muitos; vem antes de substantivo no plural.',
    ['Several experts disagreed about {T}.', 'We found several errors in {T}.']),
  W('every', 'degree', 'todo(s), cada', 'Every leva verbo no singular: "every student needs". Everyday (junto) é adjetivo: diário.',
    ['Check {T} every week.', 'Every student must understand {T}.']),
  W('each', 'degree', 'cada (um)', 'Each destaca o indivíduo dentro do grupo e leva verbo no singular. Each of exige plural: "each of the teams".',
    ['Each team reviewed {T} separately.', 'Write one sentence about {T} for each student.']),
  W('both', 'degree', 'ambos', 'Both se refere a dois e leva verbo no plural. Both... and... liga duas ideias.',
    ['Both teams reviewed {T} carefully.', 'We studied {T} in both classes.']),
  W('either', 'degree', 'um ou outro', 'Either...or... apresenta duas opções. Em negativas, either significa também não.',
    ['You can use either {T} or the older method.', 'Either the manager or the client must approve {T}.']),
  W('another', 'degree', 'outro (mais um)', 'Another = an + other, por isso vem sempre com substantivo singular: "another example".',
    ['Ask another colleague to check {T}.', 'We need another example of {T}.']),
  W('only', 'degree', 'somente, apenas', 'Only fica logo antes da palavra que limita. Mudar o lugar muda o sentido da frase.',
    ['Only authorised staff may change {T}.', 'We have only reviewed {T} once.']),
  W('also', 'degree', 'também, além disso', 'Also fica antes do verbo principal. No fim da frase, prefira too.',
    ['We also reviewed {T}.', 'The report also describes {T}.']),
  W('even', 'degree', 'até mesmo, mesmo', 'Even reforça uma surpresa: "even experts make mistakes". Não confunda com even como par (número par).',
    ['Even experts misread {T} sometimes.', 'The summary covered {T} and even the exceptions.']),
  W('almost', 'degree', 'quase', 'Almost é quase, mas não completamente: "almost finished". Nearly tem sentido parecido.',
    ['We have almost finished {T}.', 'Almost every report mentions {T}.']),
  W('too', 'degree', 'demais; também', 'Too sozinho antes de adjetivo é excessivo: "too short". No fim da frase, significa também.',
    ['The explanation of {T} was too short.', 'The deadline for {T} is too close.']),
  W('quite', 'degree', 'bastante, razoavelmente', 'Quite é bastante: "quite clear". No inglês americano é mais forte que no britânico.',
    ['The notes on {T} were quite clear.', 'The change to {T} was quite small.']),
];

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
