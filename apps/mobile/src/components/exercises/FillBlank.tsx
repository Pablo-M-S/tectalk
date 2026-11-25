import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { FillBlankExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';
import { OptionList } from './OptionList';
import { singleTerm, type ExerciseProps } from './types';

export function FillBlank({ exercise, locked, setEvaluator }: ExerciseProps<FillBlankExercise>) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setEvaluator(
      selectedId ? () => singleTerm(exercise, selectedId === exercise.correctOptionId) : null,
    );
  }, [selectedId, exercise, setEvaluator]);

  return (
    <View style={{ gap: 24 }}>
      <Text variant="label" tone="muted">Complete a frase profissional</Text>
      <View
        style={{
          padding: 20,
          borderRadius: radius.lg,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text variant="heading" style={{ lineHeight: 28, fontWeight: '500' }}>
          {exercise.sentence}
        </Text>
      </View>
      <OptionList
        options={exercise.options}
        selectedId={selectedId}
        correctId={exercise.correctOptionId}
        locked={locked}
        onSelect={setSelectedId}
      />
    </View>
  );
}
