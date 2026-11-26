import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'tectalk.track';

interface SelectionState {
  /** Slug da trilha (área profissional) em estudo. Fica salvo para o app abrir direto nela. */
  slug: string | null;
  /** `true` depois de ler o valor salvo no aparelho. */
  ready: boolean;
  select: (slug: string) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  slug: null,
  ready: false,
  select: (slug) => {
    set({ slug });
    SecureStore.setItemAsync(KEY, slug).catch(() => {});
  },
}));

export async function initSelection(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(KEY);
    useSelection.setState({ slug: saved, ready: true });
  } catch {
    useSelection.setState({ ready: true });
  }
}
