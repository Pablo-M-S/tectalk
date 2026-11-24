import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { configureClient, request } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import type { Session, User } from '@/api/types';

const TOKEN_KEY = 'tectalk.token';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  token: string | null;
  user: User | null;
  bootstrap: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  token: null,
  user: null,

  async bootstrap() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    if (!token) {
      set({ status: 'signedOut' });
      return;
    }
    // Entra direto; a validação roda em segundo plano (o servidor pode estar acordando).
    set({ status: 'signedIn', token });
    request<User>('/v1/auth/me')
      .then((user) => set({ user }))
      .catch(() => {});
  },

  async signIn(session) {
    await SecureStore.setItemAsync(TOKEN_KEY, session.accessToken);
    set({ status: 'signedIn', token: session.accessToken, user: session.user });
  },

  async signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    queryClient.clear();
    set({ status: 'signedOut', token: null, user: null });
  },
}));

configureClient({
  getToken: () => useAuth.getState().token,
  onUnauthorized: () => {
    void useAuth.getState().signOut();
  },
});
