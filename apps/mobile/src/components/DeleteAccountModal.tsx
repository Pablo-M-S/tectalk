import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { request } from '@/api/client';
import { useAuth } from '@/auth/store';
import { radius, useTheme } from '@/theme/theme';
import { Button } from './Button';
import { Text } from './Text';

/** Confirma a exclusão da conta pedindo a senha. Android não tem Alert.prompt. */
export function DeleteAccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const signOut = useAuth((state) => state.signOut);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await request<void>('/v1/auth/me', { method: 'DELETE', body: { password } });
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir agora.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: '#00000073', justifyContent: 'center', padding: 24 }}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: theme.bg, borderRadius: radius.lg, padding: 20, gap: 14 }}
        >
          <Text variant="heading">Excluir conta</Text>
          <Text tone="muted">
            Isso apaga sua conta, seu progresso, suas revisões e o caderno de memorização. Não dá para desfazer.
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Digite sua senha para confirmar"
            placeholderTextColor={theme.muted}
            style={{
              minHeight: 52,
              paddingHorizontal: 16,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: error ? theme.danger : theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
              fontSize: 16,
            }}
          />
          {error ? <Text variant="caption" tone="danger">{error}</Text> : null}
          <View style={{ gap: 8 }}>
            <Button label="Excluir definitivamente" onPress={() => void confirm()} loading={busy} disabled={!password} />
            <Button label="Cancelar" variant="ghost" onPress={close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
