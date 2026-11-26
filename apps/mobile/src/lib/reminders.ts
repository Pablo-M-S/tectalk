import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { DEFAULT_REMINDER, formatTime, messageForWeekday, parseTime, type ReminderTime } from './reminder-times';

const TIME_KEY = 'tectalk.reminder.time';
const CHANNEL_ID = 'lembretes';

interface ReminderState {
  time: ReminderTime;
  setTime: (time: ReminderTime) => void;
}

export const useReminderTime = create<ReminderState>((set) => ({
  time: DEFAULT_REMINDER,
  setTime: (time) => {
    set({ time });
    SecureStore.setItemAsync(TIME_KEY, formatTime(time)).catch(() => {});
  },
}));

/** No Android 13+ o aviso de permissão só aparece se já existir um canal de notificação. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes de estudo',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Define como notificações em primeiro plano aparecem e lê o horário salvo. */
export async function initReminders(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    await ensureChannel();
    const saved = await SecureStore.getItemAsync(TIME_KEY);
    if (saved) useReminderTime.setState({ time: parseTime(saved) });
  } catch {
    // Sem notificações, o app segue funcionando normalmente.
  }
}

/** Pede a permissão do sistema. Devolve `true` se os avisos podem ser enviados. */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Deixa agendado exatamente o que o usuário escolheu: sem lembretes, cancela tudo;
 * com lembretes, agenda um aviso por dia da semana no horário definido.
 */
export async function syncReminders(enabled: boolean, time: ReminderTime): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;

    await ensureChannel();

    await Promise.all(
      Array.from({ length: 7 }, (_, weekday) => {
        const { title, body } = messageForWeekday(weekday);
        return Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday + 1,
            hour: time.hour,
            minute: time.minute,
            channelId: CHANNEL_ID,
          },
        });
      }),
    );
  } catch {
    // Falha ao agendar não deve afetar o estudo.
  }
}

/** Dispara um aviso em 5 segundos e devolve uma mensagem com o resultado (diagnóstico). */
export async function sendTestReminder(): Promise<string> {
  try {
    if (!(await requestReminderPermission())) {
      return 'As notificações estão bloqueadas. Ative em Configurações do Android > Apps > TecTalk > Notificações.';
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'TecTalk', body: 'Lembrete de teste: está funcionando!' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
    });
    return 'Pronto! O aviso chega em 5 segundos. Pode sair do app para ver na barra de notificações.';
  } catch (e) {
    return `Este aparelho não conseguiu agendar o aviso (${e instanceof Error ? e.message : 'erro'}). Pode ser preciso instalar um APK novo.`;
  }
}
