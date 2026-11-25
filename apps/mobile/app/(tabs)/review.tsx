import { useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useActiveTrack, useDueCount } from '@/api/hooks';
import { Button } from '@/components/Button';
import { TopBar } from '@/components/TopBar';
import { Text } from '@/components/Text';
import { radius, useTheme } from '@/theme/theme';

export default function ReviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useActiveTrack();
  const due = useDueCount(slug);
  const refetch = due.refetch;

  useFocusEffect(
    useCallback(() => {
      if (slug) void refetch();
    }, [slug, refetch]),
  );

  const count = due.data?.dueCount ?? 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg, padding: 20, gap: 24 }}>
      <TopBar />
      <View style={{ gap: 6 }}>
        <Text variant="label" tone="primary">Revisão espaçada</Text>
        <Text variant="display">Fixe o que já estudou</Text>
        <Text tone="muted">
          Cada termo volta no momento em que você está prestes a esquecê-lo. Quem erra revê mais cedo.
        </Text>
      </View>

      <View
        style={{
          padding: 24,
          gap: 6,
          borderRadius: radius.lg,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ fontSize: 56, lineHeight: 62, fontWeight: '700', letterSpacing: -2 }}>
          {due.isPending ? '–' : count}
        </Text>
        <Text tone="muted">{count === 1 ? 'termo para revisar agora' : 'termos para revisar agora'}</Text>
      </View>

      {count > 0 ? (
        <Button label="Começar revisão" onPress={() => router.push('/review-session')} />
      ) : (
        <Text tone="muted">
          {due.isPending ? 'Consultando o servidor…' : 'Nada pendente. Conclua mais lições para alimentar sua revisão.'}
        </Text>
      )}
    </SafeAreaView>
  );
}
