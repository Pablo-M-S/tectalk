import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { OrderSentenceExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';
import { singleTerm, type ExerciseProps } from './types';

/** Monta uma frase profissional real: ensina o termo em seu contexto de uso. */
export function OrderSentence({ exercise, locked, setEvaluator }: ExerciseProps<OrderSentenceExercise>) {
  const theme = useTheme();
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    setEvaluator(
      picked.length === exercise.tiles.length
        ? () =>
            singleTerm(
              exercise,
              picked.map((index) => exercise.tiles[index]).join(' ') === exercise.solution.join(' '),
            )
        : null,
    );
  }, [picked, exercise, setEvaluator]);

  const tile = (index: number, onPress: () => void, filled: boolean) => (
    <Pressable
      key={index}
      disabled={locked}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: filled ? theme.primary : theme.border,
        backgroundColor: filled ? theme.primarySoft : theme.surface,
      }}
    >
      <Text style={{ fontWeight: '500' }}>{exercise.tiles[index]}</Text>
    </Pressable>
  );

  const remaining = exercise.tiles.map((_, index) => index).filter((index) => !picked.includes(index));

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text variant="label" tone="muted">Monte a frase profissional com o termo</Text>
        <Text variant="display">{exercise.prompt}</Text>
      </View>
      <View
        style={{
          minHeight: 96,
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
        {picked.map((index) => tile(index, () => setPicked((list) => list.filter((i) => i !== index)), true))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {remaining.map((index) => tile(index, () => setPicked((list) => [...list, index]), false))}
      </View>
    </View>
  );
}
