import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { warmUp } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/auth/store';
import { AppDrawer } from '@/components/AppDrawer';
import { UpdateBanner } from '@/components/UpdateBanner';
import { initFeedback } from '@/lib/feedback';
import { initBasicStats } from '@/lib/basic-stats';
import { initReminders, syncReminders, useReminderTime } from '@/lib/reminders';
import { initSpeech } from '@/lib/speech';
import { useVoiceGuard } from '@/lib/voice-guard';
import { initSelection } from '@/state/selection';
import { initTheme } from '@/theme/mode';
import { useScheme, useTheme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useScheme();
  const status = useAuth((state) => state.status);
  const bootstrap = useAuth((state) => state.bootstrap);
  const remindersEnabled = useAuth((state) => state.user?.remindersEnabled ?? false);
  const reminderTime = useReminderTime((state) => state.time);
  useVoiceGuard();

  useEffect(() => {
    warmUp();
    void initFeedback();
    void initSpeech();
    void initReminders();
    void initBasicStats();
    void initTheme();
    void initSelection();
    void bootstrap();
  }, [bootstrap]);

  // Mantém os lembretes agendados de acordo com a preferência da conta e o horário escolhido.
  useEffect(() => {
    if (status === 'signedIn') void syncReminders(remindersEnabled, reminderTime);
    if (status === 'signedOut') void syncReminders(false, reminderTime);
  }, [status, remindersEnabled, reminderTime]);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'signedIn';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="privacy" />
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="areas" />
          <Stack.Screen name="notebook" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="levels/[id]" />
          <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="review-session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="practice-session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="result" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      {signedIn ? <AppDrawer /> : null}
      <UpdateBanner />
    </QueryClientProvider>
  );
}
