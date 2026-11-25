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
    const saved = await SecureStore.getItemAsync(TIME_KEY);
    if (saved) useReminderTime.setState({ time: parseTime(saved) });
  } catch {
    // Sem notificações, o app segue funcionando normalmente.
  }
}

/** Pede a permissão do sistema. Devolve `true` se os avisos podem ser enviados. */
export async function requestReminderPermission(): Promise<boolean> {
  try {
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

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de estudo',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

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
