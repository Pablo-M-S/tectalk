import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useActiveTrack, useNotebook, useNotebookMaster, useNotebookTouch } from '@/api/hooks';
import type { NotebookItem, NotebookTouchResult } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { syncNotebookReminders } from '@/lib/reminders';
import { radius, useTheme } from '@/theme/theme';

function Dots({ done, total }: { done: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${done} de ${total} escritas hoje`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: i < done ? theme.primary : 'transparent',
            borderWidth: 1.5,
            borderColor: i < done ? theme.primary : theme.border,
          }}
        />
      ))}
    </View>
  );
}

function WordCard({
  item,
  total,
  onTouch,
  onMaster,
  busy,
}: {
  item: NotebookItem;
  total: number;
  onTouch: (answer: string) => Promise<NotebookTouchResult>;
  onMaster: () => void;
  busy: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<NotebookTouchResult | null>(null);
  const doneToday = item.touches >= total;

  const send = async () => {
    if (!value.trim()) return;
    const result = await onTouch(value);
    setFeedback(result);
    if (result.correct) setValue('');
  };

  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        borderRadius: radius.lg,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: doneToday ? theme.primary : theme.border,
      }}
    >
      <Pressable accessibilityRole="button" onPress={() => setOpen((o) => !o)} style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="heading" style={{ flex: 1 }}>{item.prompt}</Text>
          <Dots done={item.touches} total={total} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={open ? undefined : 2}>{item.hint}</Text>
      </Pressable>

      {open ? (
        <View style={{ gap: 12 }}>
          {item.show ? (
            <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: theme.primarySoft, gap: 2 }}>
              <Text variant="label" tone="primary">Olhe e escreva</Text>
              <Text variant="display">{item.show.text}</Text>
              {item.show.reading ? <Text tone="muted">{item.show.reading}</Text> : null}
            </View>
          ) : (
            <Text variant="label" tone="muted">Escreva de memória, sem olhar</Text>
          )}
          <TextInput
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setFeedback(null);
            }}
            onSubmitEditing={() => void send()}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Escreva a palavra"
            placeholderTextColor={theme.muted}
            style={{
              minHeight: 52,
              paddingHorizontal: 16,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: feedback ? (feedback.correct ? theme.primary : theme.danger) : theme.border,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 18,
            }}
          />
          {feedback ? (
            <Text variant="caption" tone={feedback.correct ? 'primary' : 'danger'}>
              {feedback.correct
                ? feedback.dayDone
                  ? 'Certo! Escritas de hoje concluídas para esta palavra.'
                  : feedback.accentsOff
                    ? `Certo! Atenção à grafia: ${feedback.expected}`
                    : 'Certo! Volte mais tarde para escrever de novo.'
                : feedback.relearn
                  ? `Era “${feedback.expected}”. Vamos recomeçar olhando a palavra.`
                  : `Ainda não. Era “${feedback.expected}”.`}
            </Text>
          ) : null}
          <Button label="Conferir" onPress={() => void send()} loading={busy} disabled={!value.trim()} />
          <Button label="Tenho certeza que memorizei" variant="ghost" onPress={onMaster} />
        </View>
      ) : null}
    </View>
  );
}

export default function NotebookScreen() {
  const theme = useTheme();
  const router = useRouter();
  const active = useActiveTrack();
  const notebook = useNotebook(active.slug);
  const touch = useNotebookTouch(active.slug);
  const master = useNotebookMaster(active.slug);
  const remindersOn = useAuth((s) => s.user?.remindersEnabled ?? false);
  const data = notebook.data;

  // Os avisos do meio do dia citam as palavras do lote atual.
  useEffect(() => {
    if (!data) return;
    void syncNotebookReminders(remindersOn, data.batch.map((b) => b.prompt));
  }, [data, remindersOn]);

  if (!active.slug) {
    return <ErrorState message="Escolha uma área para usar o caderno." onRetry={() => router.replace('/areas')} />;
  }
  if (notebook.isPending) return <LoadingState label="Abrindo o caderno…" />;
  if (notebook.isError || !data) {
    return <ErrorState message={notebook.error?.message ?? 'Não foi possível abrir o caderno.'} onRetry={() => void notebook.refetch()} />;
  }

  const confirmMaster = (item: NotebookItem) =>
    Alert.alert('Memorizou mesmo?', `“${item.prompt}” sai do caderno e vai para a revisão espaçada.`, [
      { text: 'Ainda não', style: 'cancel' },
      { text: 'Tenho certeza', onPress: () => master.mutate(item.termId) },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={theme.text} />
          </Pressable>
          <View style={{ gap: 6 }}>
            <Text variant="display">Caderno de memorização</Text>
            <Text tone="muted">
              {`Poucas palavras por vez. Escreva cada uma ${data.touchesPerDay} vezes por dia: a primeira olhando, as outras de memória.`}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <ProgressBar value={data.totalTerms > 0 ? data.masteredCount / data.totalTerms : 0} />
            <Text variant="caption" tone="muted">{`${data.masteredCount} de ${data.totalTerms} palavras dominadas`}</Text>
          </View>

          {data.finished ? (
            <Text variant="heading">Você dominou todas as palavras desta área!</Text>
          ) : (
            data.batch.map((item) => (
              <WordCard
                key={item.termId}
                item={item}
                total={data.touchesPerDay}
                busy={touch.isPending}
                onTouch={(answer) => touch.mutateAsync({ termId: item.termId, answer })}
                onMaster={() => confirmMaster(item)}
              />
            ))
          )}
          {!data.finished ? (
            <Text variant="caption" tone="muted">
              Quando tiver certeza de todas, novas palavras aparecem sozinhas.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
