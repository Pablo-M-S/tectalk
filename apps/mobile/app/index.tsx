import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/store';
import { LoadingState } from '@/components/States';

export default function Index() {
  const status = useAuth((state) => state.status);
  const onboarded = useAuth((state) => state.onboarded);

  if (status !== 'signedIn') return <Redirect href="/login" />;
  // Contas que já existiam aguardam a resposta do servidor para saber se falta o questionário.
  if (onboarded === null) return <LoadingState label="Conectando ao servidor…" />;
  return <Redirect href={onboarded ? '/areas' : '/onboarding'} />;
}
