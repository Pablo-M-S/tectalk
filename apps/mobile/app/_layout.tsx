import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { warmUp } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/auth/store';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useTheme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const status = useAuth((state) => state.status);
  const bootstrap = useAuth((state) => state.bootstrap);

  useEffect(() => {
    warmUp();
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'signedIn';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="areas" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="review-session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="practice-session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="result" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <UpdateBanner />
    </QueryClientProvider>
  );
}
