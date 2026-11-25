import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAllTracks, useUpdateProfile } from '@/api/hooks';
import type { Language, ProficiencyLevel } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ReminderTimePicker } from '@/components/ReminderTimePicker';
import { Text } from '@/components/Text';
import { GOALS, LANGUAGES, LEVELS, PROFESSIONS } from '@/lib/profile';
import { requestReminderPermission, useReminderTime } from '@/lib/reminders';
import { useSelection } from '@/state/selection';
import { radius, useTheme } from '@/theme/theme';

type Step = 'language' | 'profession' | 'level' | 'goal' | 'reminders';
const STEPS: Step[] = ['language', 'profession', 'level', 'goal', 'reminders'];

function Choice({
  label,
  hint,
  icon,
  selected,
  disabled,
  badge,
  onPress,
}: {
  label: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: selected ? theme.primary : theme.border,
        backgroundColor: selected ? theme.primarySoft : theme.surface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? <Ionicons name={icon} size={24} color={selected ? theme.primary : theme.muted} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading" style={{ fontWeight: '600' }}>{label}</Text>
        {hint ? <Text variant="caption" tone="muted">{hint}</Text> : null}
      </View>
      {badge ? <Text variant="caption" tone="muted">{badge}</Text> : null}
      {selected ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';

  const user = useAuth((state) => state.user);
  const tracks = useAllTracks();
  const select = useSelection((state) => state.select);
  const update = useUpdateProfile();

  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState<Language>(user?.targetLanguage ?? 'EN');
  const [profession, setProfession] = useState<string | null>(user?.profession ?? null);
  const [level, setLevel] = useState<ProficiencyLevel | null>(user?.level ?? null);
  const [goal, setGoal] = useState<number | null>(user?.dailyGoalMinutes ?? null);
  const [reminders, setReminders] = useState<boolean | null>(
    user?.onboardedAt ? user.remindersEnabled : null,
  );
  const [error, setError] = useState<string | null>(null);
  const reminderTime = useReminderTime((state) => state.time);
  const setReminderTime = useReminderTime((state) => state.setTime);

  const step = STEPS[index];
  const languagesWithTrack = useMemo(() => new Set(tracks.data?.map((t) => t.targetLanguage)), [tracks.data]);
  const available = useMemo(
    () => new Set(tracks.data?.filter((t) => t.targetLanguage === language).map((t) => t.profession)),
    [tracks.data, language],
  );
  const firstName = user?.displayName?.trim().split(' ')[0];

  const canContinue = {
    language: languagesWithTrack.has(language),
    profession: profession !== null,
    level: level !== null,
    goal: goal !== null,
    reminders: reminders !== null,
  }[step];

  const finish = () => {
    setError(null);
    update.mutate(
      {
        profession,
        targetLanguage: language,
        level: level ?? undefined,
        dailyGoalMinutes: goal ?? undefined,
        remindersEnabled: reminders ?? false,
        completeOnboarding: true,
      },
      {
        onSuccess: () => {
          if (editing) {
            router.back();
            return;
          }
          // Quem começa o japonês, em geral não conhece nem os alfabetos: começa pelo hiragana.
          const alphabet = !user?.onboardedAt && language === 'JA'
            ? tracks.data?.find((t) => t.slug === 'hiragana-pt-ja')
            : undefined;
          const track =
            alphabet ?? tracks.data?.find((t) => t.profession === profession && t.targetLanguage === language);
          if (track) {
            select(track.slug);
            router.replace('/trail');
          } else {
            router.replace('/areas');
          }
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  const next = () => (index === STEPS.length - 1 ? finish() : setIndex(index + 1));
  const back = () => (index === 0 ? (editing ? router.back() : undefined) : setIndex(index - 1));

  const title = {
    language: firstName ? `${firstName}, qual idioma você quer aprender?` : 'Qual idioma você quer aprender?',
    profession: 'Em qual área você atua?',
    level: `Qual é o seu nível de ${LANGUAGES.find((l) => l.code === language)?.label.toLowerCase() ?? 'idioma'} hoje?`,
    goal: 'Quanto tempo por dia você quer estudar?',
    reminders: 'Quer receber lembretes para estudar?',
  }[step];

  const subtitle = {
    language: 'Você pode trocar de idioma depois, no Perfil.',
    profession: 'Vamos começar pelo vocabulário da sua profissão.',
    level: 'Sem teste: é só para ajustarmos o ritmo.',
    goal: 'Constância vale mais que tempo. Você pode mudar isso depois.',
    reminders: 'Um aviso diário no horário em que você costuma estudar.',
  }[step];

  const unavailable = step === 'profession' && profession !== null && !available.has(profession);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 }}>
        {index > 0 || editing ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} onPress={back}>
            <Ionicons name={index === 0 ? 'close' : 'arrow-back'} size={26} color={theme.muted} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <ProgressBar value={(index + 1) / STEPS.length} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 24, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Text variant="display">{title}</Text>
          <Text tone="muted">{subtitle}</Text>
        </View>

        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          {step === 'language' &&
            LANGUAGES.map((l) => (
              <Choice
                key={l.code}
                label={l.label}
                selected={language === l.code}
                disabled={!languagesWithTrack.has(l.code)}
                badge={languagesWithTrack.has(l.code) ? undefined : 'Em breve'}
                onPress={() => setLanguage(l.code)}
              />
            ))}

          {step === 'profession' &&
            PROFESSIONS.map((p) => (
              <Choice
                key={p.slug}
                label={p.label}
                icon={p.icon}
                selected={profession === p.slug}
                badge={p.slug === 'outra' || available.has(p.slug) ? undefined : 'Em breve'}
                onPress={() => setProfession(p.slug)}
              />
            ))}

          {step === 'level' &&
            LEVELS.map((l) => (
              <Choice key={l.value} label={l.label} hint={l.hint} selected={level === l.value} onPress={() => setLevel(l.value)} />
            ))}

          {step === 'goal' &&
            GOALS.map((g) => (
              <Choice key={g.minutes} label={g.label} hint={g.hint} selected={goal === g.minutes} onPress={() => setGoal(g.minutes)} />
            ))}

          {step === 'reminders' && (
            <>
              <Choice
                label="Sim, quero lembretes"
                icon="notifications-outline"
                selected={reminders === true}
                onPress={() => {
                  setReminders(true);
                  void requestReminderPermission().then((granted) => {
                    if (!granted) {
                      setReminders(false);
                      setError('Para receber lembretes, permita as notificações nas configurações do aplicativo.');
                    } else {
                      setError(null);
                    }
                  });
                }}
              />
              <Choice
                label="Agora não"
                icon="notifications-off-outline"
                selected={reminders === false}
                onPress={() => setReminders(false)}
              />
              {reminders === true ? (
                <View style={{ gap: 10 }}>
                  <Text variant="label" tone="muted">Horário do lembrete</Text>
                  <ReminderTimePicker value={reminderTime} onChange={setReminderTime} />
                </View>
              ) : null}
              <Text variant="caption" tone="muted">
                Você pode mudar o horário ou desativar quando quiser, no Perfil.
              </Text>
            </>
          )}
        </View>

        {unavailable ? (
          <Text variant="caption" tone="muted">
            Essa área ainda não está disponível, mas está nos nossos planos. Por enquanto, você pode começar por Medicina ou Programação.
          </Text>
        ) : null}
        {error ? <Text variant="caption" tone="danger">{error}</Text> : null}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <Button
          label={index === STEPS.length - 1 ? (editing ? 'Salvar' : 'Começar') : 'Continuar'}
          onPress={next}
          disabled={!canContinue}
          loading={update.isPending}
        />
      </View>
    </SafeAreaView>
  );
}
