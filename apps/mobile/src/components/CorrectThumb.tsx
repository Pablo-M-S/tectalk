import { useEffect, useRef } from 'react';
import { Animated, Easing, Image } from 'react-native';

const SIZE = 44;

/** Joinha do acerto: entra com um pulo leve e uma pequena quicada. */
export function CorrectThumb() {
  const lift = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const hop = (to: number, duration: number, easing: (t: number) => number) =>
      Animated.timing(lift, { toValue: to, duration, easing, useNativeDriver: true });

    const animation = Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
      Animated.sequence([
        hop(-14, 150, Easing.out(Easing.quad)),
        hop(0, 150, Easing.in(Easing.quad)),
        hop(-6, 100, Easing.out(Easing.quad)),
        hop(0, 100, Easing.in(Easing.quad)),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [lift, scale]);

  return (
    <Animated.Image
      accessibilityLabel="Joinha"
      source={require('../../assets/images/thumbs-up.png')}
      resizeMode="contain"
      style={{ width: SIZE, height: SIZE, transform: [{ translateY: lift }, { scale }] }}
    />
  );
}
