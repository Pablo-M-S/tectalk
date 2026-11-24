import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Busca atualizações OTA (EAS Update) ao abrir e ao voltar para o app.
 * A atualização baixada é aplicada na próxima abertura, ou na hora via `apply`.
 */
export function useAppUpdates() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdateAvailable) Updates.fetchUpdateAsync().catch(() => {});
  }, [isUpdateAvailable]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const check = () => Updates.checkForUpdateAsync().catch(() => {});
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  return {
    ready: isUpdatePending,
    apply: () => Updates.reloadAsync().catch(() => {}),
  };
}
