import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useTheme } from '@/theme/theme';
import { useAppUpdates } from '@/updates/useAppUpdates';
import { Text } from './Text';

export function UpdateBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, apply } = useAppUpdates();

  if (!ready) return null;

  return (
    <Pressable
      onPress={apply}
      accessibilityRole="button"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: theme.primary,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <Text variant="caption" tone="onPrimary" style={{ fontWeight: '600' }}>
        Atualização pronta. Toque para reiniciar o app.
      </Text>
    </Pressable>
  );
}
