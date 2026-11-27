import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveTrack, useTrack } from '@/api/hooks';
import type { LevelNode } from '@/api/types';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { formatPercent } from '@/lib/text';
import { radius, useTheme } from '@/theme/theme';

type Phase = 'DONE' | 'NEXT' | 'LOCKED';

function LevelRow({
  level,
  phase,
  tag,
  onPress,
}: {
  level: LevelNode;
  phase: Phase;
  tag: string | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const locked = phase === 'LOCKED';
  const icon: keyof typeof Ionicons.glyphMap = locked ? 'lock-closed' : phase === 'DONE' ? 'checkmark' : 'play';
  const bg = locked ? theme.surfaceAlt : phase === 'DONE' ? theme.successSoft : theme.primarySoft;
  const fg = locked ? theme.muted : phase === 'DONE' ? theme.success : theme.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: phase === 'NEXT' ? theme.primary : theme.border,
        opacity: locked ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading">{`Nível ${level.position}${level.title ? ` · ${level.title}` : ''}`}</Text>
        <Text variant="caption" tone="muted">
          {`${level.termCount} termos${level.bestScore !== null ? ` · melhor ${formatPercent(level.bestScore)}` : ''}${tag ? ` · ${tag}` : ''}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}

export default function LevelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const active = useActiveTrack();
  const track = useTrack(active.slug);

  if (track.isPending && active.slug) return <LoadingState label="Abrindo a lição…" />;
  const lesson = track.data?.units.flatMap((unit) => unit.lessons).find((item) => item.id === id);
  if (track.isError || !lesson) {
    return <ErrorState message={track.error?.message ?? 'Lição não encontrada.'} onRetry={() => router.back()} />;
  }

  const firstOpen = lesson.levels.findIndex((level) => !level.completed);
  const required = lesson.requiredLevels;
  const remaining = Math.max(0, required - lesson.levels.filter((l) => l.completed).length);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chevron-back" size={18} color={theme.primary} />
          <Text variant="label" tone="primary">Trilha</Text>
        </Pressable>

        <View style={{ gap: 6 }}>
          <Text variant="display">{lesson.title}</Text>
          <Text tone="muted">
            {remaining > 0
              ? `Conclua ${remaining} ${remaining === 1 ? 'nível' : 'níveis'} para liberar a próxima lição. Cada nível ensina de 3 a 4 palavras.`
              : 'A próxima lição já está liberada. Os demais níveis são opcionais, para aprofundar.'}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {lesson.levels.map((level, index) => {
            const phase: Phase = level.completed ? 'DONE' : index === firstOpen ? 'NEXT' : 'LOCKED';
            const tag = index + 1 === required ? 'libera a próxima lição' : index + 1 > required ? 'opcional' : null;
            return (
              <LevelRow
                key={level.id}
                level={level}
                phase={phase}
                tag={tag}
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: level.id, lessonId: lesson.id } })}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
