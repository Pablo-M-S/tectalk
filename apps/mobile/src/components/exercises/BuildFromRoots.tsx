import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { BuildFromRootsExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { playSound } from '@/lib/sounds';
import { radius, useTheme } from '@/theme/theme';
import { singleTerm, type ExerciseProps } from './types';

export function BuildFromRoots({ exercise, locked, setEvaluator }: ExerciseProps<BuildFromRootsExercise>) {
  const theme = useTheme();
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    setEvaluator(
      picked.length > 0
        ? () =>
            singleTerm(
              exercise,
              picked.map((index) => exercise.tiles[index]).join('') === exercise.solution.join(''),
            )
        : null,
    );
  }, [picked, exercise, setEvaluator]);

  const tile = (index: number, onPress: () => void, filled: boolean) => (
    <Pressable
      key={index}
      disabled={locked}
      onPress={() => {
        playSound('tap');
        onPress();
      }}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: filled ? theme.primary : theme.border,
        backgroundColor: filled ? theme.primarySoft : theme.surface,
      }}
    >
      <Text variant="heading" style={{ fontWeight: '500' }}>{exercise.tiles[index]}</Text>
    </Pressable>
  );

  const remaining = exercise.tiles.map((_, index) => index).filter((index) => !picked.includes(index));

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text variant="label" tone="muted">Monte o termo pelas raízes</Text>
        <Text variant="display">{exercise.prompt}</Text>
      </View>
      <View
        style={{
          minHeight: 72,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {remaining.map((index) => tile(index, () => setPicked((list) => [...list, index]), false))}
      </View>
    </View>
  );
}
