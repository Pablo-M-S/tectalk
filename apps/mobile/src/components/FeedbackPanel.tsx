import { ScrollView, View } from 'react-native';
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
        <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4 }}>
            {!correct ? <Text variant="caption" tone="muted">Resposta correta</Text> : null}
            <Text variant="title">{reveal.text}</Text>
            {reveal.ipa ? <Text variant="caption" tone="muted">{reveal.ipa}</Text> : null}
            <Text variant="caption" tone="muted">{reveal.definition}</Text>
          </View>

          {reveal.example ? (
            <View style={{ gap: 2 }}>
              <Text variant="label" tone="muted">Em uso</Text>
              <Text variant="caption" style={{ fontStyle: 'italic' }}>{reveal.example}</Text>
            </View>
          ) : null}

          {reveal.usageNote ? (
            <View style={{ gap: 2 }}>
              <Text variant="label" tone="muted">Como usar</Text>
              <Text variant="caption">{reveal.usageNote}</Text>
            </View>
          ) : null}

          {reveal.collocations.length > 0 ? (
            <View style={{ gap: 2 }}>
              <Text variant="label" tone="muted">Combinações comuns</Text>
              <Text variant="caption">{reveal.collocations.join('  ·  ')}</Text>
            </View>
          ) : null}

          {reveal.informalForms.length > 0 ? (
            <Text variant="caption">
              Coloquial: {reveal.informalForms.join(', ')}. Em documentos, use “{reveal.text}”.
            </Text>
          ) : null}
        </ScrollView>
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
