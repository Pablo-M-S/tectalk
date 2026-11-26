import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { SyllableBuildExercise } from '@/api/types';
import { SpeakButton } from '@/components/SpeakButton';
import { Text } from '@/components/Text';
import { cue } from '@/lib/feedback';
import { speak } from '@/lib/speech';
import { radius, useTheme } from '@/theme/theme';
import type { ExerciseProps } from './types';

/**
 * Iniciante e básico: monta palavras a partir de sílabas embaralhadas.
 * Cada palavra certa é falada e mostra a tradução logo abaixo.
 */
export function SyllableBuild({ exercise, locked, setEvaluator, submit }: ExerciseProps<SyllableBuildExercise>) {
  const theme = useTheme();
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const submitted = useRef(false);

  const word = exercise.words[current];
  const finished = current >= exercise.words.length;

  useEffect(() => {
    setEvaluator(null);
  }, [setEvaluator]);

  useEffect(() => {
    if (finished || picked.length !== word.tiles.length) return;
    const built = picked.map((index) => word.tiles[index]).join('');
    if (built === word.text) {
      const last = current + 1 >= exercise.words.length;
      if (!last) cue('pair');
      speak(word.text);
      setCurrent((index) => index + 1);
      setPicked([]);
    } else {
      cue('wrong');
      setMistakes((list) => (list.includes(word.id) ? list : [...list, word.id]));
      setWrong(true);
      const timer = setTimeout(() => {
        setWrong(false);
        setPicked([]);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [picked, word, current, finished, exercise.words.length]);

  useEffect(() => {
    if (!finished || submitted.current) return;
    submitted.current = true;
    submit({
      correct: mistakes.length === 0,
      results: exercise.words.map((w) => ({ termId: w.id, correct: !mistakes.includes(w.id) })),
    });
  }, [finished, mistakes, exercise, submit]);

  const tile = (label: string, key: string, onPress: () => void, filled: boolean) => (
    <Pressable
      key={key}
      disabled={locked || wrong}
      onPress={() => {
        cue('tap');
        onPress();
      }}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: wrong && filled ? theme.danger : filled ? theme.primary : theme.border,
        backgroundColor: wrong && filled ? theme.dangerSoft : filled ? theme.primarySoft : theme.surface,
      }}
    >
      <Text variant="title" style={{ fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  const remaining = word ? word.tiles.map((_, index) => index).filter((index) => !picked.includes(index)) : [];

  return (
    <View style={{ gap: 24 }}>
      <Text variant="label" tone="muted">Monte as palavras com as sílabas</Text>

      {exercise.words.slice(0, current).map((done) => (
        <View
          key={done.id}
          style={{
            gap: 2,
            padding: 12,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: theme.success,
            backgroundColor: theme.successSoft,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="title" style={{ flexShrink: 1 }}>{done.text}</Text>
            <SpeakButton text={done.text} />
          </View>
          {done.reading ? <Text variant="caption" tone="muted">{done.reading}</Text> : null}
          <Text variant="body">{done.translation}</Text>
        </View>
      ))}

      {!finished ? (
        <View style={{ gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text variant="caption" tone="muted">
              Palavra {current + 1} de {exercise.words.length} · significa
            </Text>
            <Text variant="display">{word.translation}</Text>
          </View>
          <View
            style={{
              minHeight: 64,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              gap: 8,
              padding: 12,
              borderRadius: radius.lg,
              borderBottomWidth: 3,
              borderColor: theme.border,
              backgroundColor: theme.surfaceAlt,
            }}
          >
            {picked.map((index) =>
              tile(word.tiles[index], `p${index}`, () => setPicked((list) => list.filter((i) => i !== index)), true),
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {remaining.map((index) =>
              tile(word.tiles[index], `r${index}`, () => setPicked((list) => [...list, index]), false),
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}
