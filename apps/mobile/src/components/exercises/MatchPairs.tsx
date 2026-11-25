import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { MatchPairsExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { playSound } from '@/lib/sounds';
import { radius, useTheme } from '@/theme/theme';
import type { ExerciseProps } from './types';

export function MatchPairs({ exercise, locked, setEvaluator, submit }: ExerciseProps<MatchPairsExercise>) {
  const theme = useTheme();
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    setEvaluator(null);
  }, [setEvaluator]);

  useEffect(() => {
    if (submitted.current || matched.length < exercise.left.length) return;
    submitted.current = true;
    submit({
      correct: mistakes.length === 0,
      results: exercise.left.map((item) => ({ termId: item.id, correct: !mistakes.includes(item.id) })),
    });
  }, [matched, mistakes, exercise, submit]);

  const pickRight = (rightId: string) => {
    if (!selectedLeft || locked) return;
    if (rightId === selectedLeft) {
      // O último par é coberto pelo som de acerto do exercício.
      if (matched.length + 1 < exercise.left.length) playSound('pair');
      setMatched((list) => [...list, rightId]);
    } else {
      playSound('wrong');
      setMistakes((list) => (list.includes(selectedLeft) ? list : [...list, selectedLeft]));
      setFlash(rightId);
      setTimeout(() => setFlash(null), 450);
    }
    setSelectedLeft(null);
  };

  const cell = (id: string, text: string, side: 'left' | 'right') => {
    const done = matched.includes(id);
    const active = side === 'left' && selectedLeft === id;
    const wrong = side === 'right' && flash === id;
    const border = done ? theme.success : wrong ? theme.danger : active ? theme.primary : theme.border;
    const background = done ? theme.successSoft : wrong ? theme.dangerSoft : active ? theme.primarySoft : theme.surface;

    return (
      <Pressable
        key={`${side}-${id}`}
        disabled={done || locked}
        onPress={() => {
          if (side === 'left') {
            playSound('tap');
            setSelectedLeft(id);
          } else {
            pickRight(id);
          }
        }}
        style={{
          minHeight: 64,
          justifyContent: 'center',
          paddingHorizontal: 12,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: border,
          backgroundColor: background,
          opacity: done ? 0.6 : 1,
        }}
      >
        <Text variant="body" style={{ fontWeight: '500' }}>{text}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 20 }}>
      <Text variant="label" tone="muted">Associe cada termo ao seu equivalente técnico</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 10 }}>{exercise.left.map((item) => cell(item.id, item.text, 'left'))}</View>
        <View style={{ flex: 1, gap: 10 }}>{exercise.right.map((item) => cell(item.id, item.text, 'right'))}</View>
      </View>
    </View>
  );
}
