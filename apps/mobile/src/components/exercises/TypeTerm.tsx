import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import type { TypeTermExercise } from '@/api/types';
import { Text } from '@/components/Text';
import { normalizeAnswer } from '@/lib/text';
import { radius, useTheme } from '@/theme/theme';
import { singleTerm, type ExerciseProps } from './types';

export function TypeTerm({ exercise, locked, setEvaluator }: ExerciseProps<TypeTermExercise>) {
  const theme = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    const answer = normalizeAnswer(value);
    setEvaluator(
      answer
        ? () =>
            singleTerm(
              exercise,
              exercise.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === answer),
            )
        : null,
    );
  }, [value, exercise, setEvaluator]);

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 10 }}>
        <Text variant="label" tone="muted">Escreva o termo formal em inglês</Text>
        <Text variant="heading" style={{ fontWeight: '500', lineHeight: 28 }}>{exercise.prompt}</Text>
        {exercise.informalHint ? (
          <Text variant="caption" tone="muted">
            Em linguagem coloquial: “{exercise.informalHint}”. Aqui vale o termo de documentação.
          </Text>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!locked}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder="Digite o termo"
        placeholderTextColor={theme.muted}
        style={{
          minHeight: 56,
          paddingHorizontal: 18,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          color: theme.text,
          fontSize: 18,
        }}
      />
    </View>
  );
}
