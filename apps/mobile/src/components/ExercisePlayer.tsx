import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Exercise, ExerciseResult } from '@/api/types';
import { playSound } from '@/lib/sounds';
import { useTheme } from '@/theme/theme';
import { Button } from './Button';
import { BuildFromRoots } from './exercises/BuildFromRoots';
import { FillBlank } from './exercises/FillBlank';
import { MatchPairs } from './exercises/MatchPairs';
import { MultipleChoice } from './exercises/MultipleChoice';
import { OrderSentence } from './exercises/OrderSentence';
import { RegisterChoice } from './exercises/RegisterChoice';
import { TypeTerm } from './exercises/TypeTerm';
import type { AnswerOutcome } from './exercises/types';
import { FeedbackPanel } from './FeedbackPanel';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

interface Props {
  exercises: Exercise[];
  submitting: boolean;
  onFinish: (results: ExerciseResult[]) => void;
  onClose: () => void;
}

interface QueueItem {
  key: string;
  exercise: Exercise;
  retry: boolean;
}

/**
 * Executa uma sessão: cada exercício é respondido, corrigido e explicado.
 * Erros voltam ao fim da fila uma vez, mas só a primeira tentativa conta no resultado.
 */
export function ExercisePlayer({ exercises, submitting, onFinish, onClose }: Props) {
  const theme = useTheme();
  const playable = useMemo(() => exercises.filter((e) => e.type !== 'LISTEN_AND_TYPE'), [exercises]);

  const [queue, setQueue] = useState<QueueItem[]>(() =>
    playable.map((exercise) => ({ key: exercise.id, exercise, retry: false })),
  );
  const [cursor, setCursor] = useState(0);
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null);
  const [ready, setReady] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const evaluator = useRef<(() => AnswerOutcome) | null>(null);
  const answered = useRef(false);
  const results = useRef<ExerciseResult[]>([]);

  const setEvaluator = useCallback((fn: (() => AnswerOutcome) | null) => {
    evaluator.current = fn;
    setReady(fn !== null);
  }, []);

  const current = queue[cursor];

  const handleAnswer = useCallback(
    (result: AnswerOutcome) => {
      if (answered.current || !current) return;
      answered.current = true;
      setOutcome(result);
      playSound(result.correct ? 'correct' : 'wrong');
      Haptics.notificationAsync(
        result.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      if (!current.retry) {
        results.current.push(...result.results);
        setAnsweredCount((count) => count + 1);
      }
    },
    [current],
  );

  const check = () => {
    const result = evaluator.current?.();
    if (result) handleAnswer(result);
  };

  const next = () => {
    if (!current || !outcome) return;
    let nextQueue = queue;
    if (!outcome.correct && !current.retry) {
      nextQueue = [...queue, { key: `${current.key}-retry`, exercise: current.exercise, retry: true }];
      setQueue(nextQueue);
    }
    if (cursor + 1 >= nextQueue.length) {
      onFinish(results.current);
      return;
    }
    answered.current = false;
    setOutcome(null);
    setCursor(cursor + 1);
  };

  const confirmClose = () =>
    Alert.alert('Sair da sessão?', 'O progresso desta sessão será perdido.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: onClose },
    ]);

  if (!current) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', padding: 24, gap: 16 }}>
        <Text variant="title" style={{ textAlign: 'center' }}>Sem exercícios por aqui</Text>
        <Button label="Voltar" onPress={onClose} />
      </SafeAreaView>
    );
  }

  const shared = { locked: outcome !== null, setEvaluator, submit: handleAnswer };
  const exercise = current.exercise;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={12} onPress={confirmClose}>
          <Ionicons name="close" size={26} color={theme.muted} />
        </Pressable>
        <ProgressBar value={playable.length ? answeredCount / playable.length : 0} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          key={current.key}
          contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {exercise.type === 'MULTIPLE_CHOICE' && <MultipleChoice exercise={exercise} {...shared} />}
          {exercise.type === 'MATCH_PAIRS' && <MatchPairs exercise={exercise} {...shared} />}
          {exercise.type === 'TYPE_TERM' && <TypeTerm exercise={exercise} {...shared} />}
          {exercise.type === 'FILL_BLANK' && <FillBlank exercise={exercise} {...shared} />}
          {exercise.type === 'BUILD_FROM_ROOTS' && <BuildFromRoots exercise={exercise} {...shared} />}
          {exercise.type === 'REGISTER_CHOICE' && <RegisterChoice exercise={exercise} {...shared} />}
          {exercise.type === 'ORDER_SENTENCE' && <OrderSentence exercise={exercise} {...shared} />}
        </ScrollView>

        {outcome ? (
          <FeedbackPanel exercise={exercise} correct={outcome.correct} loading={submitting} onContinue={next} />
        ) : exercise.type === 'MATCH_PAIRS' ? null : (
          <View style={{ padding: 20 }}>
            <Button label="Verificar" onPress={check} disabled={!ready} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
