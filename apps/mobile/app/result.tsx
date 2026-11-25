import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { playSound } from '@/lib/sounds';
import { radius, useTheme } from '@/theme/theme';

export default function ResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kind: string; correct: string; total: string; xp: string; streak: string }>();

  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const streak = Number(params.streak ?? 0);
  const ratio = total > 0 ? correct / total : 0;

  useEffect(() => {
    playSound('complete');
  }, []);

  const headline = ratio >= 0.9 ? 'Excelente' : ratio >= 0.6 ? 'Bom trabalho' : 'Continue praticando';
  const note =
    ratio >= 0.9
      ? 'Esses termos já estão firmes.'
      : 'Os termos que você errou voltam na revisão, no momento certo.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <View style={{ gap: 8 }}>
          <Text variant="label" tone="primary">{params.kind === 'review' ? 'Revisão concluída' : params.kind === 'practice' ? 'Prática concluída' : 'Lição concluída'}</Text>
          <Text variant="display">{headline}</Text>
          <Text tone="muted">{note}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { label: 'Acertos', value: `${correct}/${total}` },
            { label: 'XP', value: `+${params.xp ?? 0}` },
            { label: 'Sequência', value: `${streak} ${streak === 1 ? 'dia' : 'dias'}` },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                gap: 4,
                padding: 16,
                borderRadius: radius.lg,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text variant="label" tone="muted">{item.label}</Text>
              <Text variant="title">{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button label="Continuar" onPress={() => router.replace('/trail')} />
    </SafeAreaView>
  );
}
