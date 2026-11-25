import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { ApiError, configureClient, request } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import type { Session, User } from '@/api/types';

const TOKEN_KEY = 'tectalk.token';
const ONBOARDED_KEY = 'tectalk.onboarded';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  token: string | null;
  user: User | null;
  /** `null` enquanto ainda não se sabe se o questionário inicial foi respondido. */
  onboarded: boolean | null;
  bootstrap: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
}

const persistOnboarded = (value: boolean) =>
  (value
    ? SecureStore.setItemAsync(ONBOARDED_KEY, '1')
    : SecureStore.deleteItemAsync(ONBOARDED_KEY)
  ).catch(() => {});

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,
  onboarded: null,

  async bootstrap() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    if (!token) {
      set({ status: 'signedOut' });
      return;
    }
    const cached = await SecureStore.getItemAsync(ONBOARDED_KEY).catch(() => null);
    // Entra direto; a validação roda em segundo plano (o servidor pode estar acordando).
    set({ status: 'signedIn', token, onboarded: cached === '1' ? true : null });
    request<User>('/v1/auth/me')
      .then((user) => get().setUser(user))
      .catch((error) => {
        // Sem conexão não deve prender o usuário na tela de carregamento.
        if (!(error instanceof ApiError && error.status === 401) && get().onboarded === null) {
          set({ onboarded: true });
        }
      });
  },

  async signIn(session) {
    const onboarded = session.user.onboardedAt !== null;
    await SecureStore.setItemAsync(TOKEN_KEY, session.accessToken);
    await persistOnboarded(onboarded);
    set({ status: 'signedIn', token: session.accessToken, user: session.user, onboarded });
  },

  setUser(user) {
    const onboarded = user.onboardedAt !== null;
    void persistOnboarded(onboarded);
    set({ user, onboarded });
  },

  async signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await persistOnboarded(false);
    queryClient.clear();
    set({ status: 'signedOut', token: null, user: null, onboarded: null });
  },
}));

configureClient({
  getToken: () => useAuth.getState().token,
  onUnauthorized: () => {
    void useAuth.getState().signOut();
  },
});
