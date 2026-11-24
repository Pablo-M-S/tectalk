import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { radius, useTheme } from '@/theme/theme';
import { Text } from './Text';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: theme.primary, fg: 'onPrimary' as const, border: theme.primary },
    secondary: { bg: theme.surface, fg: 'text' as const, border: theme.border },
    ghost: { bg: 'transparent', fg: 'primary' as const, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: radius.md,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          opacity: inactive ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={theme[palette.fg]} /> : null}
      <Text variant="heading" tone={palette.fg} style={{ fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}
