import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { MultipleChoiceExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { OptionList } from './OptionList';
import { singleTerm, type ExerciseProps } from './types';

export function MultipleChoice({ exercise, locked, setEvaluator }: ExerciseProps<MultipleChoiceExercise>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setEvaluator(
      selectedId ? () => singleTerm(exercise, selectedId === exercise.correctOptionId) : null,
    );
  }, [selectedId, exercise, setEvaluator]);

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text variant="label" tone="muted">Como se escreve em inglês técnico?</Text>
        <Text variant="display">{exercise.prompt}</Text>
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
