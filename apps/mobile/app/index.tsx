import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAllTracks } from '@/api/hooks';
import { useAuth } from '@/auth/store';
import { LoadingState } from '@/components/States';
import { useLoadingHold } from '@/lib/useLoadingHold';
import { useSelection } from '@/state/selection';

export default function Index() {
  const status = useAuth((state) => state.status);
  const onboarded = useAuth((state) => state.onboarded);
  const user = useAuth((state) => state.user);
  const saved = useSelection((state) => state.slug);
  const ready = useSelection((state) => state.ready);
  const tracks = useAllTracks();
  const waiting = onboarded === null || !ready || (onboarded === true && tracks.isPending);
  const holding = useLoadingHold(waiting);

  if (status !== 'signedIn') return <Redirect href="/login" />;
  // Contas que já existiam aguardam a resposta do servidor para saber se falta o questionário.
  if (holding || waiting) return <LoadingState label="Conectando ao servidor…" />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  // Quem já escolheu uma área volta direto para as lições dela.
  const all = tracks.data ?? [];
  const current =
    all.find((t) => t.slug === saved && t.targetLanguage === user?.targetLanguage) ??
    all.find((t) => t.profession === user?.profession && t.targetLanguage === user?.targetLanguage);
  if (!current) return <Redirect href="/areas" />;
  return <OpenTrail slug={current.slug} />;
}

function OpenTrail({ slug }: { slug: string }) {
  const select = useSelection((state) => state.select);
  const selected = useSelection((state) => state.slug);
  useEffect(() => {
    if (selected !== slug) select(slug);
  }, [selected, slug, select]);
  return selected === slug ? <Redirect href="/trail" /> : null;
}
