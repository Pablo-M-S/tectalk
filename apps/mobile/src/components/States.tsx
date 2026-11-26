import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';
import { Button } from './Button';
import { Mascot, useMascots } from './Mascot';
import { Text } from './Text';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  const theme = useTheme();
  const [slow, setSlow] = useState(false);
  const hasMascot = useMascots();

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      accessibilityLabel={label}
      style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}
    >
      {/* Só o personagem; o indicador gira apenas onde a área ainda não tem personagem. */}
      {hasMascot ? <Mascot role="loading" height={220} halo /> : <ActivityIndicator size="large" color={theme.primary} />}
      {slow ? (
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          O servidor está acordando. Na primeira vez do dia isso pode levar cerca de 1 minuto.
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <Text variant="title" style={{ textAlign: 'center' }}>Algo não funcionou</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>{message}</Text>
      <View style={{ alignSelf: 'stretch' }}>
        <Button label="Tentar de novo" onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}
