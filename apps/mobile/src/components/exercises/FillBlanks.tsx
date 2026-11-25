import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import type { FillBlanksExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { cue } from '@/lib/feedback';
import { radius, useTheme } from '@/theme/theme';
import type { ExerciseProps } from './types';

interface Rect {
  x: number;
  y: number;
}

type Slots = Record<string, string | null>;

/**
 * Ao montar, a palavra voa da posição anterior (`from`, em coordenadas da janela) até o lugar
 * onde foi renderizada. Assim a troca entre o banco e a lacuna parece um único movimento.
 */
function FlyIn({
  from,
  register,
  children,
}: {
  from: Rect | undefined;
  register: (node: View | null) => void;
  children: ReactNode;
}) {
  const node = useRef<View | null>(null);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(from ? 0 : 1)).current;
  const flown = useRef(false);

  const launch = () => {
    if (!from || flown.current) return;
    flown.current = true;
    node.current?.measureInWindow((px, py) => {
      x.setValue(from.x - px);
      y.setValue(from.y - py);
      opacity.setValue(1);
      Animated.parallel([
        Animated.spring(x, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }),
        Animated.spring(y, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }),
      ]).start();
    });
  };

  return (
    <Animated.View
      ref={(value) => {
        node.current = value as unknown as View | null;
        register(node.current);
      }}
      collapsable={false}
      onLayout={launch}
      style={{ opacity, zIndex: from ? 10 : 0, elevation: from ? 6 : 0, transform: [{ translateX: x }, { translateY: y }] }}
    >
      {children}
    </Animated.View>
  );
}

/** Completar frases: toque numa palavra do banco para ela ir à lacuna; toque na lacuna para devolver. */
export function FillBlanks({ exercise, locked, setEvaluator }: ExerciseProps<FillBlanksExercise>) {
  const theme = useTheme();
  const [slots, setSlots] = useState<Slots>(() => Object.fromEntries(exercise.sentences.map((s) => [s.id, null])));
  const [origin, setOrigin] = useState<Record<string, Rect>>({});
  const nodes = useRef<Record<string, View | null>>({});

  const filled = Object.values(slots).filter((value) => value !== null).length;

  useEffect(() => {
    setEvaluator(
      filled === exercise.sentences.length
        ? () => {
            const results = exercise.sentences.map((s) => ({ termId: s.id, correct: slots[s.id] === s.id }));
            return { correct: results.every((r) => r.correct), results };
          }
        : null,
    );
  }, [slots, filled, exercise, setEvaluator]);

  const where = (key: string) =>
    new Promise<Rect | undefined>((resolve) => {
      const node = nodes.current[key];
      if (!node) return resolve(undefined);
      node.measureInWindow((x, y) => resolve({ x, y }));
    });

  const place = async (tileId: string) => {
    if (locked) return;
    const target = exercise.sentences.find((s) => slots[s.id] === null);
    if (!target) return;
    cue('tap');
    const from = await where(`bank:${tileId}`);
    if (from) setOrigin((current) => ({ ...current, [tileId]: from }));
    setSlots((current) => ({ ...current, [target.id]: tileId }));
  };

  const release = async (sentenceId: string) => {
    const tileId = slots[sentenceId];
    if (locked || !tileId) return;
    cue('tap');
    const from = await where(`slot:${tileId}`);
    if (from) setOrigin((current) => ({ ...current, [tileId]: from }));
    setSlots((current) => ({ ...current, [sentenceId]: null }));
  };

  const used = new Set(Object.values(slots));
  const text = (id: string) => exercise.tiles.find((tile) => tile.id === id)?.text ?? '';

  const chip = (label: string, tone: 'idle' | 'right' | 'wrong') => (
    <View
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        borderColor: tone === 'right' ? theme.success : tone === 'wrong' ? theme.danger : theme.border,
        backgroundColor: tone === 'right' ? theme.successSoft : tone === 'wrong' ? theme.dangerSoft : theme.surface,
      }}
    >
      <Text style={{ fontWeight: '600', fontSize: 18 }}>{label}</Text>
    </View>
  );

  const words = (value: string, keyPrefix: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((word, index) => (
        <Text key={`${keyPrefix}-${index}`} variant="heading" style={{ fontWeight: '500', lineHeight: 44 }}>
          {word}
        </Text>
      ));

  return (
    <View style={{ gap: 28 }}>
      <Text variant="display">Complete a frase:</Text>

      <View style={{ gap: 20 }}>
        {exercise.sentences.map((sentence) => {
          const tileId = slots[sentence.id];
          const tone = !locked ? 'idle' : tileId === sentence.id ? 'right' : 'wrong';
          // Pontuação colada na lacuna (ex.: "atrium.") fica junto dela, sem espaço no meio.
          const attached = /^\S+/.exec(sentence.after)?.[0] ?? '';
          const rest = sentence.after.slice(attached.length);
          return (
            <View key={sentence.id} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}>
              {words(sentence.before, `b-${sentence.id}`)}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tileId ? `Devolver ${text(tileId)}` : 'Lacuna'}
                disabled={!tileId || locked}
                onPress={() => void release(sentence.id)}
                style={{
                  minWidth: 104,
                  minHeight: 48,
                  justifyContent: 'center',
                  borderBottomWidth: tileId ? 0 : 3,
                  borderColor: theme.border,
                  backgroundColor: tileId ? 'transparent' : theme.surfaceAlt,
                  borderRadius: radius.sm,
                }}
              >
                {tileId ? (
                  <FlyIn
                    key={tileId}
                    from={origin[tileId]}
                    register={(node) => {
                      nodes.current[`slot:${tileId}`] = node;
                    }}
                  >
                    {chip(text(tileId), tone)}
                  </FlyIn>
                ) : null}
              </Pressable>
              {attached ? <Text variant="heading" style={{ fontWeight: '500', lineHeight: 44 }}>{attached}</Text> : null}
              </View>
              {words(rest, `a-${sentence.id}`)}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, minHeight: 60, marginTop: 24 }}>
        {exercise.tiles.map((tile) =>
          used.has(tile.id) ? null : (
            <Pressable key={tile.id} disabled={locked} onPress={() => void place(tile.id)}>
              <FlyIn
                from={origin[tile.id]}
                register={(node) => {
                  nodes.current[`bank:${tile.id}`] = node;
                }}
              >
                {chip(tile.text, 'idle')}
              </FlyIn>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}
