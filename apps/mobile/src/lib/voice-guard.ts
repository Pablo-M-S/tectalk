import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/auth/store';
import { languageLabel } from './profile';
import { openVoiceSettings, useSpeech } from './speech';

/**
 * Gatilho automático: quando o idioma estudado não tem voz instalada, avisa uma única vez
 * por idioma e leva direto às configurações para baixar. Vale para qualquer idioma que entrar.
 */
export function useVoiceGuard(): void {
  const language = useAuth((state) => state.user?.targetLanguage);
  const installed = useSpeech((state) => (language ? state.installed[language] : undefined));

  useEffect(() => {
    if (!language || installed !== false) return;
    const key = `tectalk.voice.warned.${language}`;
    let cancelled = false;

    void (async () => {
      const warned = await SecureStore.getItemAsync(key).catch(() => null);
      if (cancelled || warned === '1') return;
      await SecureStore.setItemAsync(key, '1').catch(() => {});
      Alert.alert(
        'Voz não instalada',
        `Seu aparelho não tem a voz de ${languageLabel(language)} instalada. Baixe o pacote de voz para ouvir a pronúncia.`,
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Configurar voz', onPress: openVoiceSettings },
        ],
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [language, installed]);
}
