import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, useWindowDimensions, View } from 'react-native';
import { cue } from '@/lib/feedback';
import { useTheme } from '@/theme/theme';
import { Text } from './Text';

const LINES = [
  { x: 0.1, y: 0.62, h: 90, w: 3 },
  { x: 0.2, y: 0.78, h: 140, w: 4 },
  { x: 0.31, y: 0.55, h: 110, w: 3 },
  { x: 0.4, y: 0.85, h: 80, w: 3 },
  { x: 0.6, y: 0.8, h: 120, w: 3 },
  { x: 0.69, y: 0.58, h: 150, w: 4 },
  { x: 0.8, y: 0.74, h: 100, w: 3 },
  { x: 0.9, y: 0.66, h: 130, w: 3 },
];

interface Props {
  title: string;
  subtitle: string;
  onDone: () => void;
}

/**
 * Comemoração de sequência de acertos: a estrela surge pulando e depois dispara
 * para cima, com traços de velocidade. Toque para pular.
 */
export function StreakCelebration({ title, subtitle, onDone }: Props) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const starSize = Math.min(width * 0.52, 230);

  const pop = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);
  const running = useRef<Animated.CompositeAnimation | null>(null);

  const finish = useMemo(
    () => () => {
      if (finished.current) return;
      finished.current = true;
      running.current?.stop();
      onDone();
    },
    [onDone],
  );

  useEffect(() => {
    cue('complete');
    let cancelled = false;

    const run = async () => {
      const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;

      if (reduce) {
        pop.setValue(1);
        text.setValue(1);
        const timer = setTimeout(finish, 1400);
        running.current = { stop: () => clearTimeout(timer) } as Animated.CompositeAnimation;
        return;
      }

      const jump = (to: number, duration: number, easing: (t: number) => number) =>
        Animated.timing(hop, { toValue: to, duration, easing, useNativeDriver: true });

      running.current = Animated.sequence([
        Animated.parallel([
          Animated.spring(pop, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
          Animated.sequence([
            jump(-46, 200, Easing.out(Easing.quad)),
            jump(0, 220, Easing.in(Easing.quad)),
            jump(-22, 150, Easing.out(Easing.quad)),
            jump(0, 160, Easing.in(Easing.quad)),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(text, { toValue: 1, duration: 320, useNativeDriver: true }),
          ]),
        ]),
        Animated.delay(250),
        Animated.timing(fly, { toValue: 1, duration: 460, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(overlay, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]);
      running.current.start(({ finished: done }) => {
        if (done) finish();
      });
    };

    void run();
    return () => {
      cancelled = true;
      running.current?.stop();
    };
  }, [finish, fly, hop, overlay, pop, text]);

  const flightDistance = height * 0.8;

  return (
    <Animated.View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        opacity: overlay,
        backgroundColor: theme.bg,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuar"
        onPress={finish}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, overflow: 'hidden' }}
      >
        {LINES.map((line, index) => (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: width * line.x,
              top: height * line.y,
              width: line.w,
              height: line.h,
              borderRadius: line.w,
              backgroundColor: '#F5B83D',
              opacity: fly.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] }),
              transform: [
                { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -flightDistance * (1.1 + index * 0.04)] }) },
                { scaleY: fly.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) },
              ],
            }}
          />
        ))}

        <Animated.Image
          accessibilityLabel="Estrela"
          source={require('../../assets/images/star.png')}
          resizeMode="contain"
          style={{
            width: starSize,
            height: starSize,
            opacity: pop,
            transform: [
              { translateY: Animated.add(hop, fly.interpolate({ inputRange: [0, 1], outputRange: [0, -flightDistance] })) },
              { scale: Animated.multiply(pop, fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] })) },
              { scaleY: fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1.3] }) },
            ],
          }}
        />

        <Animated.View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 32, opacity: text }}>
          <Text variant="display" style={{ textAlign: 'center' }}>{title}</Text>
          <Text variant="heading" tone="muted" style={{ textAlign: 'center', fontWeight: '500' }}>{subtitle}</Text>
        </Animated.View>

        <View style={{ height: 24 }} />
      </Pressable>
    </Animated.View>
  );
}
