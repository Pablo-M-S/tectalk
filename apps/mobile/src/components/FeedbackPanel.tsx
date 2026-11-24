import { View } from 'react-native';
import type { Exercise } from '@/api/types';
import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/theme/theme';

interface Props {
  exercise: Exercise;
  correct: boolean;
  loading: boolean;
  onContinue: () => void;
}

export function FeedbackPanel({ exercise, correct, loading, onContinue }: Props) {
  const theme = useTheme();
  const reveal = exercise.reveal;

  return (
    <View
      style={{
        padding: 20,
        gap: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: correct ? theme.successSoft : theme.dangerSoft,
      }}
    >
      <Text variant="label" tone={correct ? 'success' : 'danger'}>
        {correct ? 'Correto' : 'Quase lá'}
      </Text>

      {reveal ? (
        <View style={{ gap: 4 }}>
          {!correct ? <Text variant="caption" tone="muted">Resposta correta</Text> : null}
          <Text variant="title">{reveal.text}</Text>
          {reveal.ipa ? <Text variant="caption" tone="muted">{reveal.ipa}</Text> : null}
          <Text variant="caption" tone="muted">{reveal.definition}</Text>
          {reveal.informalForms.length > 0 ? (
            <Text variant="caption" style={{ marginTop: 4 }}>
              Coloquial: {reveal.informalForms.join(', ')}. Em documentos, use “{reveal.text}”.
            </Text>
          ) : null}
        </View>
      ) : (
        <Text tone="muted">
          {correct ? 'Todos os pares corretos.' : 'Alguns pares precisaram de nova tentativa.'}
        </Text>
      )}

      {exercise.type === 'BUILD_FROM_ROOTS' ? (
        <Text variant="caption" tone="muted">
          {exercise.breakdown.map((part) => `${part.segment} = ${part.meaning}`).join('  +  ')}
        </Text>
      ) : null}

      <Button label="Continuar" onPress={onContinue} loading={loading} />
    </View>
  );
}
