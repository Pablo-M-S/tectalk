import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { request } from '@/api/client';
import type { Session } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/theme';

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

export default function RegisterScreen() {
  const theme = useTheme();
  const signIn = useAuth((state) => state.signIn);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await request<Session>('/v1/auth/register', {
        method: 'POST',
        body: {
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          interfaceLanguage: 'PT',
          timezone: deviceTimeZone(),
        },
        auth: false,
      });
      await signIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8 }}>
            <Text variant="title">Criar conta</Text>
            <Text tone="muted">Leva menos de um minuto.</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Field label="Nome" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoComplete="name" />
            <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            <Field label="Senha (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            {error ? <Text tone="danger">{error}</Text> : null}
            <Button
              label="Criar conta"
              onPress={submit}
              loading={loading}
              disabled={displayName.trim().length < 2 || !email || password.length < 8}
            />
          </View>

          <Link href="/login" style={{ alignSelf: 'center' }}>
            <Text tone="primary" style={{ fontWeight: '600' }}>Já tenho conta</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
