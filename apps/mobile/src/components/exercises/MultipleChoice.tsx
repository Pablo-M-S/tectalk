import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { MultipleChoiceExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { inLanguage } from '@/lib/profile';
import { studiedLanguage } from '@/lib/speech';
import { OptionList } from './OptionList';
import { singleTerm, type ExerciseProps } from './types';

/** A pergunta acompanha o idioma estudado e o sentido do exercício. */
function question(exercise: MultipleChoiceExercise): string {
  const reverse = exercise.direction === 'REVERSE';
  if (exercise.alphabet) return reverse ? 'Qual é o som deste caractere?' : 'Qual caractere representa este som?';
  return reverse ? 'O que significa?' : `Como se diz ${inLanguage(studiedLanguage())}?`;
}

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
        <Text variant="label" tone="muted">{question(exercise)}</Text>
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
