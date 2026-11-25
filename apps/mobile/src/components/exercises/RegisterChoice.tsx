import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { RegisterChoiceExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';
import { OptionList } from './OptionList';
import { singleTerm, type ExerciseProps } from './types';

/** Ensina registro: o que se diz na conversa vs. o que se escreve no documento. */
export function RegisterChoice({ exercise, locked, setEvaluator }: ExerciseProps<RegisterChoiceExercise>) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setEvaluator(
      selectedId ? () => singleTerm(exercise, selectedId === exercise.correctOptionId) : null,
    );
  }, [selectedId, exercise, setEvaluator]);

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 12 }}>
        <Text variant="label" tone="muted">Como se diz em um documento formal?</Text>
        <View
          style={{
            padding: 20,
            borderRadius: radius.lg,
            backgroundColor: theme.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text variant="caption" tone="muted">Coloquial</Text>
          <Text variant="title">“{exercise.prompt}”</Text>
        </View>
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
