import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/store';
import { useSelection } from '@/state/selection';
import { request } from './client';
import type {
  CompleteResponse,
  DueResponse,
  ExerciseResult,
  LessonSession,
  ProfileUpdate,
  User,
  PracticeSession,
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

export function useTracks() {
  return useQuery({
    queryKey: queryKeys.tracks,
    queryFn: () => request<TrackSummary[]>('/v1/tracks'),
  });
}

/** Área (profissão) escolhida pelo usuário na tela inicial. */
export function useActiveTrack() {
  const selected = useSelection((state) => state.slug);
  const query = useTracks();
  const summary = query.data?.find((track) => track.slug === selected);
  return {
    slug: summary?.slug,
    selected,
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

/** Prática livre: cada abertura gera uma sessão nova, com tipos de exercício variados. */
export function usePracticeSession(slug: string | undefined) {
  return useQuery({
    queryKey: ['practice-session', slug],
    queryFn: () => request<PracticeSession>(`/v1/tracks/${slug}/practice`),
    enabled: Boolean(slug),
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
    void client.invalidateQueries({ queryKey: ['tracks'] });
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

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: ProfileUpdate) =>
      request<User>('/v1/auth/me', { method: 'PATCH', body: input }),
    onSuccess: (user) => useAuth.getState().setUser(user),
  });
}
