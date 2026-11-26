import { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAllTracks, useUpdateProfile } from '@/api/hooks';
import type { TrackSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Flag } from '@/components/Flag';
import { TopBar } from '@/components/TopBar';
import { ProgressBar } from '@/components/ProgressBar';
import { ErrorState, LoadingState } from '@/components/States';
import { useLoadingHold } from '@/lib/useLoadingHold';
import { Text } from '@/components/Text';
import { LANGUAGES, languageLabel } from '@/lib/profile';
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

function AreaCard({ track, current, languages, onPress }: { track: TrackSummary; current: boolean; languages: TrackSummary[]; onPress: () => void }) {
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {languages.map((t) => (
              <Flag key={t.slug} code={t.targetLanguage} height={12} />
            ))}
            <Text variant="caption" tone="muted">
              {current ? 'Em andamento' : `${languages.length} ${languages.length === 1 ? 'idioma' : 'idiomas'}`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </View>
      <Text variant="caption" tone="muted">{track.description}</Text>
      <Text variant="caption" tone="muted">{`${track.termCount} termos · ${track.lessonCount} lições`}</Text>
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
  const tracks = useAllTracks();
  const user = useAuth((state) => state.user);
  const select = useSelection((state) => state.select);
  const updateProfile = useUpdateProfile();
  const [choosing, setChoosing] = useState<string | null>(null);
  const name = useAuth((state) => state.user?.displayName);
  const [refreshing, setRefreshing] = useState(false);
  const holding = useLoadingHold(tracks.isPending);

  if (holding && !tracks.isError) return <LoadingState label="Conectando ao servidor…" />;
  if (tracks.isError || !tracks.data) {
    return <ErrorState message={tracks.error?.message ?? 'Não foi possível carregar as áreas.'} onRetry={() => void tracks.refetch()} />;
  }

  // Uma carta por profissão; os idiomas disponíveis ficam agrupados nela.
  const grouped = new Map<string, TrackSummary[]>();
  for (const t of tracks.data) grouped.set(t.profession, [...(grouped.get(t.profession) ?? []), t]);
  const groups = [...grouped.values()];
  const order = LANGUAGES.map((l) => l.code as string);
  const byLanguage = (list: TrackSummary[]) =>
    [...list].sort((a, b) => order.indexOf(a.targetLanguage) - order.indexOf(b.targetLanguage));

  const start = (track: TrackSummary) => {
    updateProfile.mutate({ profession: track.profession, targetLanguage: track.targetLanguage });
    select(track.slug);
    setChoosing(null);
    router.replace('/trail');
  };

  const pick = (list: TrackSummary[]) => {
    const profession = list[0].profession;
    const mine = list.find((t) => t.targetLanguage === user?.targetLanguage);
    // A profissão que já está em estudo abre direto nas lições.
    if (profession === user?.profession && mine) return start(mine);
    if (list.length === 1) return start(list[0]);
    setChoosing(profession);
  };

  const options = byLanguage(groups.find((g) => g[0].profession === choosing) ?? []);

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
          <Text variant="display">Iniciar nova carreira</Text>
          <Text tone="muted">
            Escolha a área e depois o idioma. Seu progresso nas outras fica guardado.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {groups.map((list) => {
            const mine = list.find((t) => t.targetLanguage === user?.targetLanguage);
            const shown = mine ?? list[0];
            return (
              <AreaCard
                key={shown.profession}
                track={shown}
                current={Boolean(mine) && shown.profession === user?.profession}
                languages={byLanguage(list)}
                onPress={() => pick(list)}
              />
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={choosing !== null} transparent animationType="fade" onRequestClose={() => setChoosing(null)}>
        <Pressable accessibilityLabel="Fechar" onPress={() => setChoosing(null)} style={{ flex: 1, backgroundColor: '#00000073', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: theme.bg, padding: 20, paddingBottom: 32, gap: 10, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}
          >
            <Text variant="heading">Qual idioma aprender?</Text>
            {options.map((t) => (
              <Pressable
                key={t.slug}
                accessibilityRole="button"
                onPress={() => start(t)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: radius.md,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Flag code={t.targetLanguage} height={24} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>{languageLabel(t.targetLanguage)}</Text>
                  <Text variant="caption" tone="muted">
                    {t.completedCount > 0 ? `${t.completedCount} de ${t.lessonCount} lições` : `${t.termCount} termos`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
