import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTracks } from '@/api/hooks';
import type { TrackSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { TopBar } from '@/components/TopBar';
import { ProgressBar } from '@/components/ProgressBar';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { useSelection } from '@/state/selection';
import { radius, useTheme } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, IconName> = {
  medicina: 'medkit-outline',
  programacao: 'code-slash-outline',
  engenharia: 'construct-outline',
  construcao: 'hammer-outline',
  hiragana: 'language-outline',
  katakana: 'language-outline',
  direito: 'scale-outline',
  arquitetura: 'business-outline',
  ciencia: 'flask-outline',
};

function AreaCard({ track, onPress }: { track: TrackSummary; onPress: () => void }) {
  const theme = useTheme();
  const ratio = track.lessonCount > 0 ? track.completedCount / track.lessonCount : 0;
  const started = track.completedCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        gap: 14,
        padding: 18,
        borderRadius: radius.lg,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primarySoft,
          }}
        >
          <Ionicons name={ICONS[track.profession] ?? 'book-outline'} size={26} color={theme.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">{track.title}</Text>
          <Text variant="caption" tone="muted">
            {`${track.termCount} termos · ${track.lessonCount} lições`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </View>
      <Text variant="caption" tone="muted">{track.description}</Text>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row' }}>
          <ProgressBar value={ratio} />
        </View>
        <Text variant="caption" tone={started ? 'primary' : 'muted'}>
          {started
            ? `${track.completedCount} de ${track.lessonCount} lições concluídas`
            : 'Ainda não iniciada'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AreasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tracks = useTracks();
  const select = useSelection((state) => state.select);
  const name = useAuth((state) => state.user?.displayName);
  const [refreshing, setRefreshing] = useState(false);

  if (tracks.isPending) return <LoadingState label="Conectando ao servidor…" />;
  if (tracks.isError || !tracks.data) {
    return <ErrorState message={tracks.error?.message ?? 'Não foi possível carregar as áreas.'} onRetry={() => void tracks.refetch()} />;
  }

  const open = (slug: string) => {
    select(slug);
    router.replace('/trail');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await tracks.refetch();
              setRefreshing(false);
            }}
          />
        }
      >
        <TopBar />
        <View style={{ gap: 6 }}>
          <Text variant="label" tone="primary">{name ? `Olá, ${name.split(' ')[0]}` : 'TecTalk'}</Text>
          <Text variant="display">Qual área você quer dominar?</Text>
          <Text tone="muted">
            Aprenda os termos como os profissionais os escrevem e usam, não só a tradução.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {tracks.data.map((track) => (
            <AreaCard key={track.id} track={track} onPress={() => open(track.slug)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
