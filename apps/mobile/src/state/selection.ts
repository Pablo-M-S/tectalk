import { create } from 'zustand';

interface SelectionState {
  /** Slug da trilha (área profissional) escolhida na tela inicial. */
  slug: string | null;
  select: (slug: string) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  slug: null,
  select: (slug) => set({ slug }),
}));
