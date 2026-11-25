import { create } from 'zustand';

interface DrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useDrawer = create<DrawerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
