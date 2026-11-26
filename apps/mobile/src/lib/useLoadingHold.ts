import { useEffect, useRef, useState } from 'react';

/** Tempo mínimo da tela de carregamento, para o personagem dar tempo de ser visto. */
export const LOADING_MIN_MS = 4000;

/**
 * Mantém a tela de carregamento por pelo menos `ms` desde que o carregamento começou,
 * mesmo que os dados cheguem antes. Se nunca houve carregamento (dados já em cache),
 * não segura nada.
 */
export function useLoadingHold(loading: boolean, ms: number = LOADING_MIN_MS): boolean {
  const startedAt = useRef<number | null>(null);
  const [, setTick] = useState(0);

  if (loading && startedAt.current === null) startedAt.current = Date.now();

  useEffect(() => {
    if (loading || startedAt.current === null) return;
    const remaining = startedAt.current + ms - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setTick((n) => n + 1), remaining);
    return () => clearTimeout(timer);
  }, [loading, ms]);

  if (loading) return true;
  return startedAt.current !== null && Date.now() - startedAt.current < ms;
}
