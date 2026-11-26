import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useStats, useUpdateProfile } from '@/api/hooks';
import { useAuth } from '@/auth/store';
import { Button } from '@/components/Button';
import { Flag } from '@/components/Flag';
import { ReminderTimePicker } from '@/components/ReminderTimePicker';
import { TopBar } from '@/components/TopBar';
import { Text } from '@/components/Text';
import { useHaptics } from '@/lib/feedback';
import { requestReminderPermission, sendTestReminder, useReminderTime } from '@/lib/reminders';
import { useSound } from '@/lib/sounds';
import { SAMPLE_SENTENCE, openVoiceSettings, refreshVoices, speak, useSpeech } from '@/lib/speech';
import { focusLabel, accuracyOf } from '@/lib/focus';
import { useBasicStats } from '@/lib/basic-stats';
import { GOALS, LANGUAGES, languageLabel, levelLabel, professionLabel } from '@/lib/profile';
import { XpBar } from '@/components/XpBar';
import { useThemeMode, type ThemeMode } from '@/theme/mode';
import { radius, useTheme } from '@/theme/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
      <Text variant="caption" tone="muted">{label}</Text>
      <Text variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Sistema' },
  { mode: 'light', label: 'Claro' },
  { mode: 'dark', label: 'Escuro' },
];

function ThemePicker() {
  const theme = useTheme();
  const mode = useThemeMode((state) => state.mode);
  const setMode = useThemeMode((state) => state.setMode);

  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: theme.surfaceAlt }}
    >
      {THEME_OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => setMode(option.mode)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              backgroundColor: active ? theme.surface : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: theme.border,
            }}
          >
            <Text variant="caption" tone={active ? 'text' : 'muted'} style={{ fontWeight: '600' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const basicHistory = useBasicStats((state) => state.history);
  const signOut = useAuth((state) => state.signOut);
  const stats = useStats();
  const soundOn = useSound((state) => state.enabled);
  const setSoundOn = useSound((state) => state.setEnabled);
  const vibrationOn = useHaptics((state) => state.enabled);
  const setVibrationOn = useHaptics((state) => state.setEnabled);
  const autoSpeak = useSpeech((state) => state.autoPlay);
  const setAutoSpeak = useSpeech((state) => state.setAutoPlay);
  const voices = useSpeech((state) => state.installed);
  const reminderTime = useReminderTime((state) => state.time);
  const setReminderTime = useReminderTime((state) => state.setTime);
  const updateProfile = useUpdateProfile();

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && !(await requestReminderPermission())) {
      Alert.alert('Lembretes', 'Permita as notificações nas configurações do aplicativo para receber os avisos.');
      return;
    }
    updateProfile.mutate({ remindersEnabled: enabled });
  };

  const checkUpdate = async () => {
    if (!Updates.isEnabled) {
      Alert.alert('Atualizações', 'As atualizações automáticas não estão ativas nesta versão.');
      return;
    }
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert('Atualizações', 'Você já está na versão mais recente.');
        return;
      }
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      Alert.alert('Atualizações', 'Não foi possível verificar agora. Tente novamente em instantes.');
    }
  };

  const card = {
    padding: 18,
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <TopBar />
        <View style={{ gap: 4 }}>
          <Text variant="display">{user?.displayName ?? 'Perfil'}</Text>
          {user ? <Text tone="muted">{user.email}</Text> : null}
        </View>

        <View style={card}>
          <Text variant="label" tone="muted">Progresso</Text>
          <XpBar xp={stats.data?.xp ?? 0} />
          <Row label="XP total" value={String(stats.data?.xp ?? 0)} />
          <Row label="Sequência atual" value={`${stats.data?.currentStreak ?? 0} dias`} />
          <Row label="Maior sequência" value={`${stats.data?.longestStreak ?? 0} dias`} />
        </View>

        <View style={card}>
          <Text variant="label" tone="muted">Preferências de estudo</Text>
          <Row label="Idioma" value={user ? languageLabel(user.targetLanguage) : '—'} />
          <Row label="Profissão" value={professionLabel(user?.profession)} />
          <Row label="Nível" value={levelLabel(user?.level)} />
          {user?.targetLanguage === 'EN' && focusLabel(user.level, accuracyOf(basicHistory)) ? (
            <View style={{ gap: 2 }}>
              <Row label="Foco das lições" value={focusLabel(user.level, accuracyOf(basicHistory)) ?? ''} />
              <Text variant="caption" tone="muted">
                O inglês básico diminui sozinho conforme você acerta.
              </Text>
            </View>
          ) : null}
          <Row
            label="Meta diária"
            value={GOALS.find((g) => g.minutes === user?.dailyGoalMinutes)?.hint.replace(' por dia', '') ?? '—'}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">Sons dos exercícios</Text>
            <Switch
              value={soundOn}
              onValueChange={setSoundOn}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">Vibração</Text>
            <Switch
              value={vibrationOn}
              onValueChange={setVibrationOn}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">Ler palavras em voz alta</Text>
            <Switch
              value={autoSpeak}
              onValueChange={setAutoSpeak}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="caption" tone="muted">Vozes instaladas no aparelho</Text>
            {LANGUAGES.map((item) => {
              const ready = voices[item.code];
              return (
                <View key={item.code} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Flag code={item.code} height={14} />
                    <Text variant="caption">{item.label}</Text>
                  </View>
                  <Text variant="caption" tone={ready === false ? 'danger' : 'muted'}>
                    {ready === undefined ? 'verificando…' : ready ? 'instalada' : 'não instalada'}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              label="Testar voz"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() =>
                user &&
                speak(SAMPLE_SENTENCE[user.targetLanguage], 'normal', user.targetLanguage, () =>
                  Alert.alert(
                    'Voz indisponível',
                    'Não foi possível tocar a voz. Confira o volume de mídia e baixe o pacote do idioma em "Configurar voz".',
                  ),
                )
              }
            />
            <Button label="Configurar voz" variant="secondary" style={{ flex: 1 }} onPress={openVoiceSettings} />
          </View>
          <Button label="Verificar vozes de novo" variant="ghost" onPress={() => void refreshVoices()} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">Lembrete diário</Text>
            <Switch
              value={user?.remindersEnabled ?? false}
              onValueChange={(value) => void toggleReminders(value)}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          {user?.remindersEnabled ? <ReminderTimePicker value={reminderTime} onChange={setReminderTime} /> : null}
          <Button
            label="Testar lembrete"
            variant="ghost"
            onPress={() => void sendTestReminder().then((msg) => Alert.alert('Lembrete', msg))}
          />
          <Button
            label="Editar preferências"
            variant="secondary"
            onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}
          />
        </View>

        <View style={card}>
          <Text variant="label" tone="muted">Aparência</Text>
          <ThemePicker />
        </View>

        <View style={card}>
          <Text variant="label" tone="muted">Aplicativo</Text>
          <Row label="Versão" value={Constants.expoConfig?.version ?? '—'} />
          <Row label="Canal" value={Updates.channel ?? 'desenvolvimento'} />
          <Row label="Atualização" value={Updates.updateId ? Updates.updateId.slice(0, 8) : 'embutida'} />
          <Button label="Verificar atualização" variant="secondary" onPress={() => void checkUpdate()} />
        </View>

        <Button label="Sair" variant="ghost" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
