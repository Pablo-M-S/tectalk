import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { accuracyOf, pushResult } from './focus';

const KEY = 'tectalk.basic.history';

interface BasicStatsState {
  history: string;
  record: (correct: boolean) => void;
}

/** Acertos e erros recentes em inglês básico. Fica no aparelho e serve para ajustar o foco. */
export const useBasicStats = create<BasicStatsState>((set, get) => ({
  history: '',
  record: (correct) => {
    const history = pushResult(get().history, correct);
    set({ history });
    SecureStore.setItemAsync(KEY, history).catch(() => {});
  },
}));

export async function initBasicStats(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(KEY);
    if (saved && /^[01]+$/.test(saved)) useBasicStats.setState({ history: saved });
  } catch {
    // sem histórico salvo: começa do zero
  }
}

/** Precisão recente para enviar ao servidor, ou undefined enquanto há poucas respostas. */
export const currentBasicAccuracy = (): number | undefined => accuracyOf(useBasicStats.getState().history);
