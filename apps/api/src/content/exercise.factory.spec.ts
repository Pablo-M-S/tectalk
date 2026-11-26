import { makePool, makeTerm, seeded } from '../../test/helpers';
import { ExerciseFactory } from './exercise.factory';
import { BASIC_WORDS, technicalShare } from './basic-english';
import type { Exercise } from './exercise.types';

describe('ExerciseFactory', () => {
  const pool = makePool();
  const byId = (id: string) => pool.find((t) => t.id === id)!;
  let factory: ExerciseFactory;

  beforeEach(() => {
    factory = new ExerciseFactory(seeded());
  });

  describe('shuffle', () => {
    it('mantém os mesmos elementos e não altera o original', () => {
      const original = [1, 2, 3, 4, 5, 6];
      const result = factory.shuffle(original);
      expect([...result].sort()).toEqual(original);
      expect(original).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('multipleChoice', () => {
    it('gera 4 opções únicas, incluindo a correta', () => {
      const exercise = factory.multipleChoice(byId('t1'), pool)!;
      expect(exercise.options).toHaveLength(4);
      expect(new Set(exercise.options.map((o) => o.text)).size).toBe(4);
      expect(exercise.options.find((o) => o.id === exercise.correctOptionId)?.text).toBe('atrium');
      expect(exercise.prompt).toBe('átrio');
    });

    it('devolve null quando não há distratores', () => {
      expect(factory.multipleChoice(byId('t1'), [byId('t1')])).toBeNull();
    });

    it('traz o ensino de uso no reveal', () => {
      const { reveal } = factory.multipleChoice(byId('t1'), pool)!;
      expect(reveal?.usageNote).toBe('Nota sobre atrium');
      expect(reveal?.example).toContain('atrium');
    });
  });

  describe('fillBlank', () => {
    it('troca a resposta por lacuna e a frase deixa de conter o termo', () => {
      const exercise = factory.fillBlank(byId('t1'), pool)!;
      expect(exercise.sentence).toContain('_____');
      expect(exercise.sentence).not.toContain('atrium');
      expect(exercise.options.find((o) => o.id === exercise.correctOptionId)?.text).toBe('atrium');
    });

    it('usa o exemplo mostrado no reveal', () => {
      const exercise = factory.fillBlank(byId('t1'), pool)!;
      const restored = exercise.sentence.replace('_____', 'atrium');
      expect(exercise.reveal?.example).toBe(restored);
    });

    it('devolve null sem exemplo utilizável', () => {
      expect(factory.fillBlank(byId('t6'), pool)).toBeNull();
      const broken = makeTerm('x', 'x', 'x', { examples: [{ sentence: 'Nada aqui.', answer: 'termo' }] });
      expect(factory.fillBlank(broken, pool)).toBeNull();
    });
  });

  describe('registerChoice', () => {
    it('apresenta a forma coloquial e pede o termo formal', () => {
      const exercise = factory.registerChoice(byId('t2'), pool)!;
      expect(exercise.prompt).toBe('irregular heartbeat');
      expect(exercise.options.find((o) => o.id === exercise.correctOptionId)?.text).toBe('arrhythmia');
    });

    it('não se aplica a termos sem forma coloquial', () => {
      expect(factory.registerChoice(byId('t1'), pool)).toBeNull();
    });
  });

  describe('orderSentence', () => {
    it('embaralha as palavras da frase sem perder nenhuma', () => {
      const exercise = factory.orderSentence(byId('t1'))!;
      expect([...exercise.tiles].sort()).toEqual([...exercise.solution].sort());
      expect(exercise.tiles.join(' ')).not.toBe(exercise.solution.join(' '));
      expect(exercise.solution.join(' ')).toContain('atrium');
    });

    it('ignora frases curtas demais', () => {
      const short = makeTerm('s', 's', 'cache', { examples: [{ sentence: 'Clear the cache.', answer: 'cache' }] });
      expect(factory.orderSentence(short)).toBeNull();
    });

    it('ignora frases longas demais', () => {
      const sentence = `${'word '.repeat(15)}cache`;
      const long = makeTerm('l', 'l', 'cache', { examples: [{ sentence, answer: 'cache' }] });
      expect(factory.orderSentence(long)).toBeNull();
    });
  });

  describe('buildFromRoots', () => {
    it('exige ao menos dois segmentos', () => {
      expect(factory.buildFromRoots(byId('t5'), [])).toBeNull();
    });

    it('inclui os segmentos da solução entre as peças', () => {
      const exercise = factory.buildFromRoots(byId('t3'), ['ar', 'rhythm', 'brady'])!;
      expect(exercise.solution).toEqual(['tachy', 'cardia']);
      expect(exercise.tiles).toEqual(expect.arrayContaining(['tachy', 'cardia']));
    });
  });

  describe('matchPairs', () => {
    it('limita a 5 pares e mantém ids iguais dos dois lados', () => {
      const exercise = factory.matchPairs(pool)!;
      expect(exercise.left).toHaveLength(5);
      expect(exercise.left.map((o) => o.id).sort()).toEqual(exercise.right.map((o) => o.id).sort());
    });

    it('precisa de ao menos 2 termos', () => {
      expect(factory.matchPairs([byId('t1')])).toBeNull();
    });
  });

  describe('fillBlanks', () => {
    it('gera de 2 a 3 frases e um banco com o termo de cada uma', () => {
      const exercise = factory.fillBlanks(pool)!;
      expect(exercise.sentences.length).toBeGreaterThanOrEqual(2);
      expect(exercise.sentences.length).toBeLessThanOrEqual(3);
      expect(exercise.tiles.map((t) => t.id).sort()).toEqual(exercise.sentences.map((s) => s.id).sort());
      expect(exercise.termIds.sort()).toEqual(exercise.sentences.map((s) => s.id).sort());
    });

    it('devolve as frases completas quando cada termo vai para a sua lacuna', () => {
      const exercise = factory.fillBlanks(pool)!;
      for (const sentence of exercise.sentences) {
        const tile = exercise.tiles.find((t) => t.id === sentence.id)!;
        const full = sentence.before + tile.text + sentence.after;
        expect(byId(sentence.id).examples.some((e) => e.sentence === full)).toBe(true);
      }
    });

    it('não repete o mesmo termo no banco de palavras', () => {
      const exercise = factory.fillBlanks(pool)!;
      expect(new Set(exercise.tiles.map((t) => t.text)).size).toBe(exercise.tiles.length);
    });

    it('devolve null quando há menos de dois termos com exemplo', () => {
      expect(factory.fillBlanks([byId('t1')])).toBeNull();
      expect(factory.fillBlanks([byId('t6'), byId('t1')])).toBeNull();
    });
  });

  describe('buildLessonSession', () => {
    it('respeita o limite de 20 exercícios e começa por reconhecimento', () => {
      const session = factory.buildLessonSession({ terms: pool, pool, audioEnabled: false });
      expect(session.length).toBeLessThanOrEqual(20);
      expect(session[0].type).toBe('MULTIPLE_CHOICE');
    });

    it('não inclui áudio quando está desligado', () => {
      const session = factory.buildLessonSession({ terms: pool, pool, audioEnabled: false });
      expect(session.some((e) => e.type === 'LISTEN_AND_TYPE')).toBe(false);
    });

    it('varia os tipos de exercício', () => {
      const types = new Set(factory.buildLessonSession({ terms: pool, pool, audioEnabled: false }).map((e) => e.type));
      expect(types.size).toBeGreaterThanOrEqual(4);
    });
  });

  describe('buildPracticeSession', () => {
    it('gera no máximo 12 exercícios por termo mais um de associação', () => {
      const session = factory.buildPracticeSession({ terms: pool, pool, audioEnabled: false });
      const single = session.filter((e) => e.type !== 'MATCH_PAIRS' && e.type !== 'FILL_BLANKS');
      expect(single.length).toBeLessThanOrEqual(12);
      expect(single).toHaveLength(pool.length);
      expect(session.filter((e) => e.type === 'MATCH_PAIRS')).toHaveLength(1);
      expect(session.filter((e) => e.type === 'FILL_BLANKS')).toHaveLength(1);
    });

    it('não monta associação com menos de 4 termos', () => {
      const session = factory.buildPracticeSession({ terms: pool.slice(0, 3), pool, audioEnabled: false });
      expect(session.some((e) => e.type === 'MATCH_PAIRS')).toBe(false);
    });

    it('cada termo aparece uma vez', () => {
      const session = factory.buildPracticeSession({ terms: pool, pool, audioEnabled: false });
      const ids = session
        .filter((e) => e.type !== 'MATCH_PAIRS' && e.type !== 'FILL_BLANKS')
        .map((e) => e.termIds[0]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

describe('ExerciseFactory: leitura como resposta', () => {
  it('aceita o termo e a leitura (hiragana/pinyin), mas não a transcrição IPA', () => {
    const term = makeTerm('j1', 'viga', '梁');
    term.target.ipa = 'はり';
    expect(new ExerciseFactory(seeded()).typeTerm(term).acceptedAnswers).toEqual(['梁', 'はり']);

    const english = makeTerm('e1', 'viga', 'beam');
    english.target.ipa = '/biːm/';
    expect(new ExerciseFactory(seeded()).typeTerm(english).acceptedAnswers).toEqual(['beam']);
  });
});

describe('ExerciseFactory: traduções extras', () => {
  it('leva os outros idiomas do termo para o reveal', () => {
    const term = makeTerm('t9', 'viga', 'beam');
    term.others = [
      { language: 'ES', text: 'viga', reading: null },
      { language: 'JA', text: '梁', reading: 'はり' },
    ];
    const pool = [term, makeTerm('t10', 'pilar', 'column'), makeTerm('t11', 'carga', 'load'), makeTerm('t12', 'aço', 'steel')];
    const exercise = new ExerciseFactory(seeded()).multipleChoice(term, pool);
    expect(exercise?.reveal?.translations).toEqual(term.others);
  });

  it('devolve lista vazia quando o termo só tem o par estudado', () => {
    const term = makeTerm('t13', 'viga', 'beam');
    const pool = [term, makeTerm('t14', 'pilar', 'column'), makeTerm('t15', 'carga', 'load'), makeTerm('t16', 'aço', 'steel')];
    expect(new ExerciseFactory(seeded()).multipleChoice(term, pool)?.reveal?.translations).toEqual([]);
  });
});

describe('ExerciseFactory: japonês', () => {
  const word = (id: string, pt: string, text: string, reading: string, romaji: string) => {
    const term = makeTerm(id, pt, text);
    term.target.ipa = reading;
    term.target.romanization = romaji;
    return term;
  };
  const kana = (id: string, romaji: string, text: string) => {
    const term = makeTerm(id, romaji, text);
    term.target.romanization = romaji;
    return term;
  };

  it('mostra leitura e romaji nas opções de uma palavra', () => {
    const terms = [
      word('w1', 'viga', '梁', 'はり', 'hari'),
      word('w2', 'pilar', '柱', 'はしら', 'hashira'),
      word('w3', 'carga', '荷重', 'かじゅう', 'kajuu'),
      word('w4', 'aço', '鋼', 'はがね', 'hagane'),
    ];
    const exercise = new ExerciseFactory(seeded()).multipleChoice(terms[0], terms)!;
    expect(exercise.options.find((o) => o.id === 'w1')?.text).toBe('梁\nはり · hari');
  });

  it('não entrega a resposta nos alfabetos: a opção é só o caractere', () => {
    const terms = [kana('k1', 'ka', 'か'), kana('k2', 'ki', 'き'), kana('k3', 'ku', 'く'), kana('k4', 'ke', 'け')];
    const exercise = new ExerciseFactory(seeded()).multipleChoice(terms[0], terms)!;
    expect(exercise.options.map((o) => o.text).sort()).toEqual(['か', 'き', 'く', 'け']);
  });

  it('pergunta o contrário: vê o termo e escolhe o significado', () => {
    const terms = [
      word('w1', 'viga', '梁', 'はり', 'hari'),
      word('w2', 'pilar', '柱', 'はしら', 'hashira'),
      word('w3', 'carga', '荷重', 'かじゅう', 'kajuu'),
      word('w4', 'aço', '鋼', 'はがね', 'hagane'),
    ];
    const exercise = new ExerciseFactory(seeded()).reverseChoice(terms[0], terms)!;
    expect(exercise.prompt).toBe('梁\nはり · hari');
    expect(exercise.options.map((o) => o.text).sort()).toEqual(['aço', 'carga', 'pilar', 'viga']);
    expect(exercise.correctOptionId).toBe('w1');
  });

  it('não gera o contrário para idiomas com alfabeto latino', () => {
    const pool = [makeTerm('a', 'viga', 'beam'), makeTerm('b', 'pilar', 'column'), makeTerm('c', 'carga', 'load')];
    expect(new ExerciseFactory(seeded()).reverseChoice(pool[0], pool)).toBeNull();
  });

  it('aceita hiragana, romaji e a forma curta do romaji ao digitar', () => {
    const term = word('w5', 'espelho', '空気', 'くうき', 'kuuki');
    expect(new ExerciseFactory(seeded()).typeTerm(term).acceptedAnswers).toEqual(['空気', 'くうき', 'kuuki', 'kuki']);
  });

  it('nos alfabetos não pede para digitar, pois a definição entregaria a resposta', () => {
    const terms = [kana('k1', 'ka', 'か'), kana('k2', 'ki', 'き'), kana('k3', 'ku', 'く'), kana('k4', 'ke', 'け')];
    const session = new ExerciseFactory(seeded()).buildLessonSession({ terms, pool: terms, audioEnabled: false });
    expect(session.some((e) => e.type === 'TYPE_TERM')).toBe(false);
    expect(session.some((e) => e.type === 'MULTIPLE_CHOICE')).toBe(true);
  });
});

describe('inglês básico junto aos termos técnicos', () => {
  const pool = [
    makeTerm('a', 'viga', 'beam'),
    makeTerm('b', 'pilar', 'column'),
    makeTerm('c', 'carga', 'load'),
    makeTerm('d', 'laje', 'slab'),
    makeTerm('e', 'sapata', 'footing'),
    makeTerm('f', 'estaca', 'pile'),
  ].map((t) => ({ ...t, examples: [{ sentence: `Check the ${t.target.text} today.`, answer: t.target.text }] }));
  const build = (share: number) =>
    new ExerciseFactory(seeded()).buildLessonSession({ terms: pool, pool, audioEnabled: false, technicalShare: share });
  const isBasic = (e: Exercise) => (e.type === 'FILL_BLANK' || e.type === 'MULTIPLE_CHOICE') && e.basic === true;

  it('define a parte técnica por nível: 50, 60, 70 e 100%', () => {
    expect(technicalShare('BEGINNER')).toBe(0.5);
    expect(technicalShare('BASIC')).toBe(0.6);
    expect(technicalShare('INTERMEDIATE')).toBe(0.7);
    expect(technicalShare('ADVANCED')).toBe(1);
    expect(technicalShare(null)).toBe(1);
  });

  it('avançado e quem não informou o nível recebem só termos técnicos', () => {
    expect(build(1).some(isBasic)).toBe(false);
  });

  it('quem acerta o inglês básico migra para mais foco técnico', () => {
    expect(technicalShare('BEGINNER', 0.95)).toBe(0.75);
    expect(technicalShare('BASIC', 0.85)).toBeGreaterThan(0.6);
    expect(technicalShare('BASIC', 0.5)).toBe(0.6);
    expect(technicalShare('ADVANCED', 0.2)).toBe(1);
  });

  it('iniciante: metade da sessão é inglês básico e a sessão não passa de 24 exercícios', () => {
    const session = build(0.5);
    expect(session.length).toBeLessThanOrEqual(24);
    expect(session.filter(isBasic)).toHaveLength(12);
  });

  it('intermediário: cerca de 70% de termos técnicos', () => {
    const session = build(0.7);
    const technical = session.filter((e) => !isBasic(e)).length;
    expect(technical / session.length).toBeGreaterThanOrEqual(0.65);
    expect(technical / session.length).toBeLessThanOrEqual(0.75);
  });

  it('o inglês básico fica espalhado, e a sessão sempre começa pelo termo técnico', () => {
    const session = build(0.5);
    expect(isBasic(session[0])).toBe(false);
    expect(session.map((e) => (isBasic(e) ? 'B' : 'T')).join('')).not.toContain('BBB');
  });

  it('frase curta: no máximo 4 palavras, termo técnico em destaque, lacuna e resposta entre as opções', () => {
    const factory = new ExerciseFactory(seeded());
    const sentences = BASIC_WORDS.flatMap((entry) => {
      const exercise = factory.basicSentence(entry, pool[0]);
      return exercise ? [exercise] : [];
    });
    expect(sentences.length).toBeGreaterThan(30);
    for (const exercise of sentences) {
      expect(exercise.sentence.split(/\s+/).length).toBeLessThanOrEqual(5);
      expect(exercise.sentence).toContain('_____');
      expect(exercise.sentence).toContain(exercise.highlight ?? '?');
      expect(exercise.options.map((o) => o.id)).toContain(exercise.correctOptionId);
      expect(exercise.options).toHaveLength(4);
      expect(exercise.termIds).toEqual([]);
      expect(exercise.reveal?.example?.toLowerCase()).toContain(exercise.correctOptionId);
    }
  });

  it('palavra isolada: a palavra em inglês e três significados em português', () => {
    const factory = new ExerciseFactory(seeded());
    const exercises = BASIC_WORDS.map((entry) => factory.basicMeaning(entry, pool[0])!);
    for (const [index, exercise] of exercises.entries()) {
      expect(exercise.prompt).toBe(BASIC_WORDS[index].word);
      expect(exercise.options).toHaveLength(4);
      expect(exercise.options.find((o) => o.id === exercise.correctOptionId)?.text).toBe(BASIC_WORDS[index].pt);
      expect(new Set(exercise.options.map((o) => o.text)).size).toBe(4);
      expect(exercise.termIds).toEqual([]);
    }
  });

  it('palavras com tradução parecida não aparecem juntas como opções', () => {
    const factory = new ExerciseFactory(seeded());
    const yet = BASIC_WORDS.find((w) => w.word === 'yet')!;
    for (let i = 0; i < 30; i++) {
      const texts = factory.basicMeaning(yet)!.options.map((o) => o.text);
      expect(texts.filter((t) => t.includes('ainda'))).toHaveLength(1);
    }
  });

  it('as frases-modelo são curtas, têm a palavra uma vez e um único marcador do termo', () => {
    for (const entry of BASIC_WORDS) {
      for (const template of entry.templates) {
        expect(template.split('{T}')).toHaveLength(2);
        expect(template.split(/\s+/).length).toBeLessThanOrEqual(4);
        expect(template.match(new RegExp(`\\b${entry.word}\\b`, 'gi')) ?? []).toHaveLength(1);
      }
    }
  });
});
