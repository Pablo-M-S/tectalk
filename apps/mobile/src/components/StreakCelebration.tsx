import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, useWindowDimensions } from 'react-native';
import { cue } from '@/lib/feedback';
import { useTheme } from '@/theme/theme';
import { Text } from './Text';

const STAR = require('../../assets/images/star.png');

/** Traços de velocidade: posição horizontal/vertical relativa, tamanho e duração do ciclo. */
const LINES = [
  { x: 0.08, y: 0.7, h: 90, w: 3, ms: 520 },
  { x: 0.18, y: 0.84, h: 140, w: 4, ms: 600 },
  { x: 0.29, y: 0.6, h: 110, w: 3, ms: 560 },
  { x: 0.4, y: 0.9, h: 80, w: 3, ms: 500 },
  { x: 0.6, y: 0.86, h: 120, w: 3, ms: 540 },
  { x: 0.71, y: 0.62, h: 150, w: 4, ms: 620 },
  { x: 0.82, y: 0.78, h: 100, w: 3, ms: 510 },
  { x: 0.92, y: 0.68, h: 130, w: 3, ms: 580 },
];

const PARTICLE_COUNT = 20;
const SHAKE_MS = 520;
const BURST_MS = 1100;
const SHAKE_STEPS = Array.from({ length: 21 }, (_, i) => i / 20);
const SHAKE_X = SHAKE_STEPS.map((_, i) => (i === 0 ? 0 : (i % 2 === 0 ? -1 : 1) * (2 + i * 0.7)));
const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

interface Props {
  title: string;
  subtitle: string;
  onDone: () => void;
}

/**
 * Comemoração de sequência de acertos. A estrela surge pulando e segue se agitando,
 * com traços de velocidade, até a pessoa tocar na tela; então explode em estrelas
 * menores que caem para os lados, para fora da tela, e a sessão continua.
 */
export function StreakCelebration({ title, subtitle, onDone }: Props) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const starSize = Math.min(width * 0.52, 230);

  const pop = useRef(new Animated.Value(0)).current;
  const alive = useRef(new Animated.Value(1)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const anchor = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const lineClocks = useRef(LINES.map(() => new Animated.Value(0))).current;

  const hopNow = useRef(0);
  const exploding = useRef(false);
  const reduceMotion = useRef(false);
  const running = useRef<Animated.CompositeAnimation[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopAll = () => {
    running.current.forEach((animation) => animation.stop());
    running.current = [];
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        // Ângulos espalhados por toda a volta, com variação para não parecer um desenho regular.
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (((i * 7) % 5) - 2) * 0.11;
        const reach = width * (0.5 + 0.13 * ((i * 3) % 6));
        const kick = 300 + 55 * ((i * 5) % 4);
        const v0 = Math.sin(angle) * kick;
        const fall = height * (0.55 + 0.09 * ((i * 2) % 5));
        const g = 2 * (fall - v0);
        return {
          size: starSize * (0.2 + 0.045 * (i % 4)),
          spin: (i % 2 === 0 ? -1 : 1) * (320 + 90 * (i % 3)),
          x: STEPS.map((t) => Math.cos(angle) * reach * t),
          y: STEPS.map((t) => v0 * t + 0.5 * g * t * t),
        };
      }),
    [height, starSize, width],
  );

  useEffect(() => {
    cue('complete');
    const listener = hop.addListener(({ value }) => {
      hopNow.current = value;
    });
    let cancelled = false;

    const loop = (animation: Animated.CompositeAnimation) => {
      const looping = Animated.loop(animation);
      running.current.push(looping);
      looping.start();
    };

    const start = async () => {
      reduceMotion.current = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;

      if (reduceMotion.current) {
        pop.setValue(1);
        text.setValue(1);
        hint.setValue(1);
        return;
      }

      const timing = (value: Animated.Value, toValue: number, duration: number, easing?: (t: number) => number) =>
        Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

      Animated.parallel([
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
        Animated.sequence([timing(text, 0, 1), Animated.delay(250), timing(text, 1, 320)]),
        Animated.sequence([timing(hint, 0, 1), Animated.delay(1100), timing(hint, 1, 400)]),
      ]).start();

      // Agitação rápida e contínua da estrela.
      loop(Animated.sequence([timing(hop, -28, 170, Easing.out(Easing.quad)), timing(hop, 0, 170, Easing.in(Easing.quad))]));
      loop(Animated.sequence([timing(wiggle, 1, 120), timing(wiggle, -1, 240), timing(wiggle, 0, 120)]));
      loop(Animated.sequence([timing(pulse, 1, 170), timing(pulse, 0, 170)]));

      // Traços de velocidade subindo sem parar, defasados entre si.
      lineClocks.forEach((clock, index) => {
        const timer = setTimeout(() => {
          if (cancelled || exploding.current) return;
          loop(timing(clock, 1, LINES[index].ms, Easing.linear));
        }, index * 70);
        timers.current.push(timer);
      });
    };

    void start();
    return () => {
      cancelled = true;
      hop.removeListener(listener);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    if (exploding.current) return;
    exploding.current = true;
    stopAll();

    if (reduceMotion.current) {
      onDone();
      return;
    }

    cue('tap');
    anchor.setValue(hopNow.current);

    // 1) A estrela treme cada vez mais forte enquanto encolhe; 2) explode em estrelas menores.
    Animated.parallel([
      Animated.timing(shake, { toValue: 1, duration: SHAKE_MS, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(text, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(hint, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      cue('burst');
      alive.setValue(0);
      Animated.timing(burst, { toValue: 1, duration: BURST_MS, easing: Easing.linear, useNativeDriver: true }).start(() => {
        Animated.timing(overlay, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => onDone());
      });
    });
  };

  return (
    <Animated.View
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
        accessibilityLabel="Toque para continuar"
        onPress={handlePress}
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
              opacity: lineClocks[index].interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] }),
              transform: [
                { translateY: lineClocks[index].interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.7] }) },
                { scaleY: lineClocks[index].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] }) },
              ],
            }}
          />
        ))}

        <Animated.Image
          accessibilityLabel="Estrela"
          source={STAR}
          resizeMode="contain"
          style={{
            width: starSize,
            height: starSize,
            opacity: Animated.multiply(pop, alive),
            transform: [
              { translateY: hop },
              { translateX: shake.interpolate({ inputRange: SHAKE_STEPS, outputRange: SHAKE_X }) },
              { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) },
              { scale: Animated.multiply(Animated.multiply(pop, pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] })), shake.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] })) },
            ],
          }}
        />

        <Animated.View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 32, opacity: text }}>
          <Text variant="display" style={{ textAlign: 'center' }}>{title}</Text>
          <Text variant="heading" tone="muted" style={{ textAlign: 'center', fontWeight: '500' }}>{subtitle}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: hint }}>
          <Text variant="caption" tone="muted">Toque para continuar</Text>
        </Animated.View>

        {/* Estrelas menores da explosão, partindo do centro da estrela. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateY: anchor }],
          }}
        >
          {particles.map((particle, index) => (
            <Animated.Image
              key={index}
              source={STAR}
              resizeMode="contain"
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                opacity: burst.interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 1, 1] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: STEPS, outputRange: particle.x }) },
                  { translateY: burst.interpolate({ inputRange: STEPS, outputRange: particle.y }) },
                  { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${particle.spin}deg`] }) },
                ],
              }}
            />
          ))}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
