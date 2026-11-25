import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTracks } from '@/api/hooks';
import { useAuth } from '@/auth/store';
import { PROFESSIONS } from '@/lib/profile';
import { useDrawer } from '@/state/drawer';
import { useSelection } from '@/state/selection';
import { radius, useTheme } from '@/theme/theme';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;

function Item({
  icon,
  label,
  caption,
  active,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  caption?: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        backgroundColor: active ? theme.primarySoft : pressed ? theme.surfaceAlt : 'transparent',
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={active ? theme.primary : theme.muted} />
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ fontWeight: active ? '700' : '500' }}>{label}</Text>
        {caption ? <Text variant="caption" tone="muted">{caption}</Text> : null}
      </View>
      {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
    </Pressable>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Text variant="label" tone="muted" style={{ paddingHorizontal: 14, marginTop: 20, marginBottom: 4 }}>
      {title}
    </Text>
  );
}

/** Menu lateral em JS puro (sem módulos nativos), para continuar chegando por atualização OTA. */
export function AppDrawer() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(330, Math.round(width * 0.84));

  const open = useDrawer((state) => state.open);
  const setOpen = useDrawer((state) => state.setOpen);
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  const selected = useSelection((state) => state.slug);
  const select = useSelection((state) => state.select);
  const tracks = useTracks();

  const [mounted, setMounted] = useState(false);
  const slide = useRef(new Animated.Value(-panelWidth)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: -panelWidth, duration: 180, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setMounted(false);
        },
      );
    }
  }, [open, panelWidth, slide]);

  const go = (action: () => void) => {
    setOpen(false);
    action();
  };

  const available = new Set(tracks.data?.map((track) => track.profession));
  const upcoming = PROFESSIONS.filter((p) => p.slug !== 'outra' && !available.has(p.slug));
  const initial = (user?.displayName ?? '?').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.View
          style={{
            width: panelWidth,
            backgroundColor: theme.bg,
            transform: [{ translateX: slide }],
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
            borderRightWidth: 1,
            borderRightColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 8 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.primary,
              }}
            >
              <Text variant="heading" tone="onPrimary">{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading" numberOfLines={1}>{user?.displayName ?? 'TecTalk'}</Text>
              {user ? <Text variant="caption" tone="muted" numberOfLines={1}>{user.email}</Text> : null}
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 16 }}>
            <Section title="Categorias" />
            {(tracks.data ?? []).map((track) => (
              <Item
                key={track.id}
                icon={PROFESSIONS.find((p) => p.slug === track.profession)?.icon ?? 'book-outline'}
                label={track.title}
                caption={`${track.completedCount} de ${track.lessonCount} lições`}
                active={track.slug === selected}
                onPress={() =>
                  go(() => {
                    select(track.slug);
                    router.navigate('/trail');
                  })
                }
              />
            ))}
            {upcoming.map((area) => (
              <Item key={area.slug} icon={area.icon} label={area.label} caption="Em breve" disabled />
            ))}
            <Item
              icon="grid-outline"
              label="Ver todas as áreas"
              onPress={() => go(() => router.navigate('/areas'))}
            />

            <Section title="Conta" />
            <Item icon="person-outline" label="Perfil e progresso" onPress={() => go(() => router.navigate('/profile'))} />
            <Item
              icon="options-outline"
              label="Preferências de estudo"
              onPress={() => go(() => router.push({ pathname: '/onboarding', params: { edit: '1' } }))}
            />
          </ScrollView>

          <View style={{ paddingHorizontal: 10 }}>
            <Item icon="log-out-outline" label="Sair" onPress={() => go(() => void signOut())} />
          </View>
        </Animated.View>

        <Pressable
          accessibilityLabel="Fechar menu"
          onPress={() => setOpen(false)}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: '#000',
              opacity: slide.interpolate({ inputRange: [-panelWidth, 0], outputRange: [0, 0.45] }),
            }}
          />
        </Pressable>
      </View>
    </Modal>
  );
}
