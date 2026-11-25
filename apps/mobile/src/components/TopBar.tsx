import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '@/state/drawer';
import { useTheme } from '@/theme/theme';
import { Text } from './Text';

/** Barra superior com o ícone de hambúrguer que abre o menu lateral. */
export function TopBar({ title = 'TecTalk' }: { title?: string }) {
  const theme = useTheme();
  const setOpen = useDrawer((state) => state.setOpen);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        hitSlop={12}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="menu" size={22} color={theme.text} />
      </Pressable>
      <Text variant="heading">{title}</Text>
    </View>
  );
}
