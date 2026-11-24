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

export default function LoginScreen() {
  const theme = useTheme();
  const signIn = useAuth((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await request<Session>('/v1/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
        auth: false,
      });
      await signIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
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
            <Text variant="label" tone="primary">TecTalk</Text>
            <Text variant="display">Fale como um profissional da área.</Text>
            <Text tone="muted">Vocabulário técnico formal, do jeito que aparece na documentação.</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
            {error ? <Text tone="danger">{error}</Text> : null}
            <Button label="Entrar" onPress={submit} loading={loading} disabled={!email || !password} />
          </View>

          <Link href="/register" style={{ alignSelf: 'center' }}>
            <Text tone="primary" style={{ fontWeight: '600' }}>Criar conta</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
