import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Duração do fogo, a mesma do som (fire.wav). */
export const FIRE_MS = 2200;

interface Props {
  /** 0 → 1 ao longo de FIRE_MS: acende (0–0,2), queima (0,2–0,68) e apaga (0,68–1). */
  progress: Animated.Value;
  size: number;
}

const COLORS = ['#FF7A18', '#FFC83D', '#FF3D2E', '#FF9A2E', '#FFD86B'];

interface Tongue {
  x: number;
  y: number;
  size: number;
  color: string;
  tilt: number;
  delay: number;
  period: number;
}

/** Línguas de fogo em volta do símbolo: mais no alto, onde o fogo sobe, e poucas nas laterais. */
function buildTongues(size: number): Tongue[] {
  const radius = size * 0.52;
  const angles = [-170, -145, -118, -90, -62, -35, -10, 20, 160];
  return angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const up = deg < 0;
    return {
      x: Math.cos(rad) * radius * 1.05,
      y: Math.sin(rad) * radius * (up ? 1.1 : 0.7) - (up ? size * 0.06 : 0),
      size: size * (up ? 0.5 + ((i * 37) % 5) * 0.04 : 0.38),
      color: COLORS[i % COLORS.length],
      tilt: Math.cos(rad) * 22,
      delay: (i % 4) * 0.035,
      period: 120 + ((i * 53) % 5) * 30,
    };
  });
}

function Flame({ tongue, progress, size }: { tongue: Tongue; progress: Animated.Value; size: number }) {
  const flicker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: tongue.period, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: tongue.period, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker, tongue.period]);

  const d = tongue.delay;
  const scale = progress.interpolate({
    inputRange: [0, 0.04 + d, 0.2 + d, 0.6, 0.85, 1],
    outputRange: [0, 0.15, 1, 1, 0.35, 0],
    extrapolate: 'clamp',
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.03 + d, 0.6, 0.9, 1],
    outputRange: [0, 1, 1, 0.25, 0],
    extrapolate: 'clamp',
  });
  const rise = progress.interpolate({ inputRange: [0, 0.2, 0.68, 1], outputRange: [6, 0, -4, -size * 0.22], extrapolate: 'clamp' });
  const wobble = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.16] });
  const sway = flicker.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: size / 2 + tongue.x - tongue.size / 2,
        top: size / 2 + tongue.y - tongue.size / 2,
        opacity,
        transform: [
          { translateY: rise },
          { scale },
          { scaleY: wobble },
          { rotate: `${tongue.tilt}deg` },
          { translateX: sway },
        ],
      }}
    >
      <Ionicons name="flame" size={tongue.size} color={tongue.color} />
    </Animated.View>
  );
}

/** Fumaça que sobe quando o fogo apaga. */
function Smoke({ progress, size, offset }: { progress: Animated.Value; size: number; offset: number }) {
  const opacity = progress.interpolate({ inputRange: [0.66, 0.78, 1], outputRange: [0, 0.4, 0], extrapolate: 'clamp' });
  const y = progress.interpolate({ inputRange: [0.66, 1], outputRange: [0, -size * 0.7], extrapolate: 'clamp' });
  const scale = progress.interpolate({ inputRange: [0.66, 1], outputRange: [0.5, 1.5], extrapolate: 'clamp' });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: size / 2 + offset - size * 0.14,
        top: size * 0.1,
        width: size * 0.28,
        height: size * 0.28,
        borderRadius: size * 0.14,
        backgroundColor: '#9AA3AF',
        opacity,
        transform: [{ translateY: y }, { scale }],
      }}
    />
  );
}

/** Fogo que pega em volta do símbolo e logo apaga. Fica sobre o ícone, sem interceptar toques. */
export function FireRing({ progress, size }: Props) {
  const tongues = useMemo(() => buildTongues(size), [size]);
  const glow = progress.interpolate({
    inputRange: [0, 0.12, 0.45, 0.75, 1],
    outputRange: [0, 0.55, 0.4, 0.12, 0],
    extrapolate: 'clamp',
  });
  const glowScale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.25, 1.1], extrapolate: 'clamp' });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, left: 0, top: 0 }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: -size * 0.3,
          top: -size * 0.3,
          width: size * 1.6,
          height: size * 1.6,
          borderRadius: size * 0.8,
          backgroundColor: '#FF8A1F',
          opacity: glow,
          transform: [{ scale: glowScale }],
        }}
      />
      {tongues.map((tongue, index) => (
        <Flame key={index} tongue={tongue} progress={progress} size={size} />
      ))}
      <Smoke progress={progress} size={size} offset={-size * 0.18} />
      <Smoke progress={progress} size={size} offset={size * 0.12} />
      <Smoke progress={progress} size={size} offset={size * 0.3} />
    </View>
  );
}
