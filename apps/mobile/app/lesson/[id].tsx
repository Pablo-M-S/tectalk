import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCompleteLesson, useLessonSession } from '@/api/hooks';
import type { ExerciseResult } from '@/api/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { ErrorState, LoadingState } from '@/components/States';
import { useLoadingHold } from '@/lib/useLoadingHold';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useLessonSession(id);
  const complete = useCompleteLesson();
  const holding = useLoadingHold(session.isPending);

  const finish = useCallback(
    (results: ExerciseResult[]) => {
      complete.mutate(
        { lessonId: id, results },
        {
          onSuccess: (data) =>
            router.replace({
              pathname: '/result',
              params: {
                kind: 'lesson',
                correct: String(data.correct),
                total: String(data.total),
                xp: String(data.xpEarned),
                streak: String(data.stats.currentStreak),
                xpTotal: String(data.stats.xp),
              },
            }),
          onError: (error) =>
            Alert.alert('Não foi possível salvar', error.message, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Tentar de novo', onPress: () => finish(results) },
            ]),
        },
      );
    },
    [complete, id, router],
  );

  if (holding && !session.isError) return <LoadingState label="Preparando a lição…" />;
  if (session.isError || !session.data) {
    return <ErrorState message={session.error?.message ?? 'Lição indisponível.'} onRetry={() => void session.refetch()} />;
  }

  return (
    <ExercisePlayer
      exercises={session.data.exercises}
      submitting={complete.isPending}
      onFinish={finish}
      onClose={() => router.back()}
    />
  );
}
