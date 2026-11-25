import { Pressable, View } from 'react-native';
import type { Option } from '@/api/types';
import { Text } from '@/components/Text';
import { cue } from '@/lib/feedback';
import { radius, useTheme } from '@/theme/theme';

interface Props {
  options: Option[];
  selectedId: string | null;
  correctId: string;
  locked: boolean;
  onSelect: (id: string) => void;
}

export function OptionList({ options, selectedId, correctId, locked, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View style={{ gap: 10 }}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        let border = selected ? theme.primary : theme.border;
        let background = selected ? theme.primarySoft : theme.surface;

        if (locked && option.id === correctId) {
          border = theme.success;
          background = theme.successSoft;
        } else if (locked && selected) {
          border = theme.danger;
          background = theme.dangerSoft;
        }

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            disabled={locked}
            onPress={() => {
              cue('tap');
              onSelect(option.id);
            }}
            style={{
              minHeight: 56,
              justifyContent: 'center',
              paddingHorizontal: 18,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: border,
              backgroundColor: background,
            }}
          >
            <Text variant="heading" style={{ fontWeight: '500' }}>{option.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
