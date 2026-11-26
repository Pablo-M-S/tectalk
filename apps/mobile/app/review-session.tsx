import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveTrack, useReviewSession, useSubmitReview } from '@/api/hooks';
import type { ExerciseResult } from '@/api/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { ErrorState, LoadingState } from '@/components/States';
import { useLoadingHold } from '@/lib/useLoadingHold';

export default function ReviewSessionScreen() {
  const router = useRouter();
  const { slug } = useActiveTrack();
  const session = useReviewSession(slug);
  const holding = useLoadingHold(session.isPending);
  const submit = useSubmitReview(slug);

  const finish = useCallback(
    (results: ExerciseResult[]) => {
      submit.mutate(results, {
        onSuccess: (data) =>
          router.replace({
            pathname: '/result',
            params: {
              kind: 'review',
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
      });
    },
    [submit, router],
  );

  if (holding && !session.isError) return <LoadingState label="Montando sua revisão…" />;
  if (session.isError || !session.data) {
    return <ErrorState message={session.error?.message ?? 'Revisão indisponível.'} onRetry={() => void session.refetch()} />;
  }

  return (
    <ExercisePlayer
      exercises={session.data.exercises}
      submitting={submit.isPending}
      onFinish={finish}
      onClose={() => router.back()}
    />
  );
}
