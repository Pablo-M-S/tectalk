import { makePool, makeTerm, seeded } from '../../test/helpers';
import { ExerciseFactory } from './exercise.factory';

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
      const single = session.filter((e) => e.type !== 'MATCH_PAIRS');
      expect(single.length).toBeLessThanOrEqual(12);
      expect(single).toHaveLength(pool.length);
      expect(session.filter((e) => e.type === 'MATCH_PAIRS')).toHaveLength(1);
    });

    it('não monta associação com menos de 4 termos', () => {
      const session = factory.buildPracticeSession({ terms: pool.slice(0, 3), pool, audioEnabled: false });
      expect(session.some((e) => e.type === 'MATCH_PAIRS')).toBe(false);
    });

    it('cada termo aparece uma vez', () => {
      const session = factory.buildPracticeSession({ terms: pool, pool, audioEnabled: false });
      const ids = session.filter((e) => e.type !== 'MATCH_PAIRS').map((e) => e.termIds[0]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
