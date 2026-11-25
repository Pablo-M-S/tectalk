import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import type { Exercise } from '@/api/types';
import { Button } from './Button';
import { CorrectThumb } from './CorrectThumb';
import { SpeakButton } from './SpeakButton';
import { Text } from './Text';
import { speak, stopSpeaking, useSpeech } from '@/lib/speech';
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
  const autoPlay = useSpeech((state) => state.autoPlay);
  const spoken = reveal?.text;

  // Ao mostrar o termo correto, a pronúncia toca sozinha (se ativada no Perfil).
  useEffect(() => {
    if (autoPlay && spoken) speak(spoken);
    return stopSpeaking;
  }, [autoPlay, spoken]);

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <Text variant="label" tone={correct ? 'success' : 'danger'}>
          {correct ? 'Correto' : 'Quase lá'}
        </Text>
        {correct ? <CorrectThumb /> : null}
      </View>

      {exercise.type === 'FILL_BLANKS' ? (
        <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          <Text variant="label" tone="muted">{correct ? 'Frases completas' : 'Como ficam as frases'}</Text>
          {exercise.sentences.map((sentence) => {
            const full = sentence.before + (exercise.tiles.find((tile) => tile.id === sentence.id)?.text ?? '') + sentence.after;
            return (
              <View key={sentence.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ flex: 1, fontStyle: 'italic' }}>{full}</Text>
                <SpeakButton text={full} />
              </View>
            );
          })}
        </ScrollView>
      ) : reveal ? (
        <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4 }}>
            {!correct ? <Text variant="caption" tone="muted">Resposta correta</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="title" style={{ flexShrink: 1 }}>{reveal.text}</Text>
              <SpeakButton text={reveal.text} />
              <SpeakButton text={reveal.text} pace="slow" label="Devagar" />
            </View>
            {reveal.ipa ? <Text variant="caption" tone="muted">{reveal.ipa}</Text> : null}
            {reveal.definition ? <Text variant="caption" tone="muted">{reveal.definition}</Text> : null}
          </View>

          {reveal.example ? (
            <View style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="label" tone="muted">Em uso</Text>
                <SpeakButton text={reveal.example} />
              </View>
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
