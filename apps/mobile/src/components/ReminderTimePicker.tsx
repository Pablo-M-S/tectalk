import { Pressable, View } from 'react-native';
import { REMINDER_TIMES, formatTime, type ReminderTime } from '@/lib/reminder-times';
import { radius, useTheme } from '@/theme/theme';
import { Text } from './Text';

interface Props {
  value: ReminderTime;
  onChange: (time: ReminderTime) => void;
}

export function ReminderTimePicker({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {REMINDER_TIMES.map((time) => {
        const active = time.hour === value.hour && time.minute === value.minute;
        return (
          <Pressable
            key={formatTime(time)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(time)}
            style={{
              minWidth: 68,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              borderWidth: 1.5,
              borderColor: active ? theme.primary : theme.border,
              backgroundColor: active ? theme.primarySoft : theme.surface,
            }}
          >
            <Text variant="caption" tone={active ? 'primary' : 'muted'} style={{ fontWeight: '600' }}>
              {formatTime(time)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
