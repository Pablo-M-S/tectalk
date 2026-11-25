import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speak, type SpeechPace } from '@/lib/speech';
import { Text } from './Text';
import { useTheme } from '@/theme/theme';

interface Props {
  text: string;
  pace?: SpeechPace;
  label?: string;
}

/** Botão de pronúncia. A versão `slow` lê pausadamente, para ouvir cada sílaba. */
export function SpeakButton({ text, pace = 'normal', label }: Props) {
  const theme = useTheme();
  const slow = pace === 'slow';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={slow ? `Ouvir devagar: ${text}` : `Ouvir: ${text}`}
      hitSlop={8}
      onPress={() => speak(text, pace)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 40,
        height: 40,
        paddingHorizontal: label ? 12 : 0,
        borderRadius: 20,
        backgroundColor: theme.primarySoft,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={slow ? 'volume-low-outline' : 'volume-high-outline'} size={20} color={theme.primary} />
      {label ? (
        <Text variant="caption" tone="primary" style={{ fontWeight: '600' }}>{label}</Text>
      ) : null}
    </Pressable>
  );
}
