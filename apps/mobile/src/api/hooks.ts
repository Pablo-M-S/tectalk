import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from './client';
import type {
  CompleteResponse,
  DueResponse,
  ExerciseResult,
  LessonSession,
  ReviewResponse,
  Stats,
  TrackDetail,
  TrackSummary,
} from './types';

export const queryKeys = {
  tracks: ['tracks'] as const,
  track: (slug: string) => ['track', slug] as const,
  stats: ['stats'] as const,
  dueCount: (slug: string) => ['due-count', slug] as const,
};

export function useActiveTrack() {
  const query = useQuery({
    queryKey: queryKeys.tracks,
    queryFn: () => request<TrackSummary[]>('/v1/tracks'),
  });
  const summary = query.data?.[0];
  return {
    slug: summary?.slug,
    summary,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTrack(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.track(slug ?? ''),
    queryFn: () => request<TrackDetail>(`/v1/tracks/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => request<Stats>('/v1/me/stats'),
  });
}

export function useDueCount(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dueCount(slug ?? ''),
    queryFn: () => request<DueResponse>(`/v1/reviews/${slug}/due?limit=1`),
    enabled: Boolean(slug),
    staleTime: 0,
  });
}

/** Sessões ficam congeladas enquanto a tela está aberta e não são guardadas em cache. */
export function useLessonSession(lessonId: string) {
  return useQuery({
    queryKey: ['session', lessonId],
    queryFn: () => request<LessonSession>(`/v1/lessons/${lessonId}/session`),
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
  });
}

export function useReviewSession(slug: string | undefined) {
  return useQuery({
    queryKey: ['review-session', slug],
    queryFn: () => request<DueResponse>(`/v1/reviews/${slug}/due?limit=15`),
    enabled: Boolean(slug),
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
  });
}

function useRefreshProgress() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ['track'] });
    void client.invalidateQueries({ queryKey: ['stats'] });
    void client.invalidateQueries({ queryKey: ['due-count'] });
  };
}

export function useCompleteLesson() {
  const refresh = useRefreshProgress();
  return useMutation({
    mutationFn: (input: { lessonId: string; results: ExerciseResult[] }) =>
      request<CompleteResponse>(`/v1/lessons/${input.lessonId}/complete`, {
        method: 'POST',
        body: { results: input.results },
      }),
    onSuccess: refresh,
  });
}

export function useSubmitReview(slug: string | undefined) {
  const refresh = useRefreshProgress();
  return useMutation({
    mutationFn: (results: ExerciseResult[]) =>
      request<ReviewResponse>(`/v1/reviews/${slug}/submit`, {
        method: 'POST',
        body: { results },
      }),
    onSuccess: refresh,
  });
}
