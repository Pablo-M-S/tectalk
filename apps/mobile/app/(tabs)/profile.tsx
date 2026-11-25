import { Alert, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useStats } from '@/api/hooks';
import { useAuth } from '@/auth/store';
import { Button } from '@/components/Button';
import { TopBar } from '@/components/TopBar';
import { Text } from '@/components/Text';
import { useSound } from '@/lib/sounds';
import { GOALS, languageLabel, levelLabel, professionLabel } from '@/lib/profile';
import { radius, useTheme } from '@/theme/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
      <Text variant="caption" tone="muted">{label}</Text>
      <Text variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  const stats = useStats();
  const soundOn = useSound((state) => state.enabled);
  const setSoundOn = useSound((state) => state.setEnabled);

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
          <Row label="XP total" value={String(stats.data?.xp ?? 0)} />
          <Row label="Sequência atual" value={`${stats.data?.currentStreak ?? 0} dias`} />
          <Row label="Maior sequência" value={`${stats.data?.longestStreak ?? 0} dias`} />
        </View>

        <View style={card}>
          <Text variant="label" tone="muted">Preferências de estudo</Text>
          <Row label="Idioma" value={user ? languageLabel(user.targetLanguage) : '—'} />
          <Row label="Profissão" value={professionLabel(user?.profession)} />
          <Row label="Nível" value={levelLabel(user?.level)} />
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
          <Row label="Lembretes" value={user?.remindersEnabled ? 'Ativados' : 'Desativados'} />
          <Button
            label="Editar preferências"
            variant="secondary"
            onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}
          />
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
