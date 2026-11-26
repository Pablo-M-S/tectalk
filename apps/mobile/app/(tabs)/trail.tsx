import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useActiveTrack, useStats, useTrack } from '@/api/hooks';
import type { LessonNode } from '@/api/types';
import { Text } from '@/components/Text';
import { TopBar } from '@/components/TopBar';
import { Flag } from '@/components/Flag';
import { Mascot } from '@/components/Mascot';
import { XpBar } from '@/components/XpBar';
import { ErrorState, LoadingState } from '@/components/States';
import { useLoadingHold } from '@/lib/useLoadingHold';
import { formatPercent } from '@/lib/text';
import { radius, useTheme } from '@/theme/theme';

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text variant="caption" style={{ fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function LessonRow({ lesson, onPress }: { lesson: LessonNode; onPress: () => void }) {
  const theme = useTheme();
  const locked = lesson.status === 'LOCKED';
  const completed = lesson.status === 'COMPLETED';

  const iconName: keyof typeof Ionicons.glyphMap = locked ? 'lock-closed' : completed ? 'checkmark' : 'play';
  const iconBg = locked ? theme.surfaceAlt : completed ? theme.successSoft : theme.primarySoft;
  const iconFg = locked ? theme.muted : completed ? theme.success : theme.primary;

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
        borderColor: theme.border,
        opacity: locked ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg }}>
        <Ionicons name={iconName} size={20} color={iconFg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading">{lesson.title}</Text>
        <Text variant="caption" tone="muted">
          {lesson.termCount} termos{lesson.bestScore !== null ? ` · melhor resultado ${formatPercent(lesson.bestScore)}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}

export default function TrailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const active = useActiveTrack();
  const track = useTrack(active.slug);
  const stats = useStats();
  const [refreshing, setRefreshing] = useState(false);
  const holding = useLoadingHold(active.isLoading || (Boolean(active.slug) && track.isPending));

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([active.refetch(), track.refetch(), stats.refetch()]);
    setRefreshing(false);
  };

  if (!active.isLoading && !active.error && !active.slug) return <Redirect href="/areas" />;

  if (holding && !(active.error ?? track.error)) {
    return <LoadingState label="Conectando ao servidor…" />;
  }

  const error = active.error ?? track.error;
  if (error || !track.data) {
    return <ErrorState message={error?.message ?? 'Nenhuma trilha disponível no momento.'} onRetry={() => void refresh()} />;
  }

  const summary = active.summary;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={theme.primary} />}
      >
        <TopBar />
        <View style={{ gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/areas')}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            {summary ? (
              <>
                <Flag code={summary.sourceLanguage} height={16} />
                <Ionicons name="arrow-forward" size={12} color={theme.primary} />
                <Flag code={summary.targetLanguage} height={16} />
              </>
            ) : (
              <Ionicons name="grid-outline" size={14} color={theme.primary} />
            )}
            <Text variant="label" tone="primary">
              {summary ? `${summary.sourceLanguage} → ${summary.targetLanguage} · trocar de área` : 'Trocar de área'}
            </Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="display">{track.data.title}</Text>
              <Text tone="muted">{track.data.description}</Text>
            </View>
            <Mascot role="intro" height={150} visible={0.62} halo />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Chip icon="calendar-outline" label={`${stats.data?.currentStreak ?? 0} dias seguidos`} />
        </View>

        <XpBar xp={stats.data?.xp ?? 0} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/notebook')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: radius.lg,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="create-outline" size={26} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Caderno de memorização</Text>
            <Text variant="caption" tone="muted">4 palavras por vez, escritas ao longo do dia</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Pressable>

        {track.data.units.map((unit, index) => (
          <View key={unit.id} style={{ gap: 10 }}>
            <Text variant="label" tone="muted">{`Unidade ${index + 1} · ${unit.title}`}</Text>
            {unit.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} onPress={() => router.push(`/lesson/${lesson.id}`)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
