import { TextInput, View, type TextInputProps } from 'react-native';
import { radius, useTheme } from '@/theme/theme';
import { Text } from './Text';

interface Props extends TextInputProps {
  label: string;
}

export function Field({ label, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" tone="muted">{label}</Text>
      <TextInput
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        style={[
          {
            minHeight: 54,
            paddingHorizontal: 16,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.text,
            fontSize: 17,
          },
          style,
        ]}
      />
    </View>
  );
}
