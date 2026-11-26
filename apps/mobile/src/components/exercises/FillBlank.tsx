import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { FillBlankExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';
import { OptionList } from './OptionList';
import { answerOutcome, type ExerciseProps } from './types';

/** Destaca o termo técnico dentro da frase de inglês básico. */
function highlighted(sentence: string, term?: string) {
  const at = term ? sentence.indexOf(term) : -1;
  if (!term || at < 0) return sentence;
  return (
    <>
      {sentence.slice(0, at)}
      <Text variant="heading" tone="primary" style={{ lineHeight: 28, fontWeight: '800' }}>{term}</Text>
      {sentence.slice(at + term.length)}
    </>
  );
}

export function FillBlank({ exercise, locked, setEvaluator }: ExerciseProps<FillBlankExercise>) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setEvaluator(
      selectedId ? () => answerOutcome(exercise, selectedId === exercise.correctOptionId) : null,
    );
  }, [selectedId, exercise, setEvaluator]);

  return (
    <View style={{ gap: 24 }}>
      <Text variant="label" tone="muted">
        {exercise.basic ? 'Inglês básico · complete a frase' : 'Complete a frase profissional'}
      </Text>
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
          {highlighted(exercise.sentence, exercise.highlight)}
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
