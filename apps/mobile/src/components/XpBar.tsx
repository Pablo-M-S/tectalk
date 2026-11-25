import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, View } from 'react-native';
import { FIRE_MS, FireRing } from './FireRing';
import { Text } from './Text';
import { cue } from '@/lib/feedback';
import { xpProgress } from '@/lib/xp';
import { useTheme } from '@/theme/theme';

const FLAME = require('../../assets/images/xp-flame.png');

interface Props {
  /** XP total atual. */
  xp: number;
  /** XP total de antes: a barra parte daí e enche até `xp`, passando de nível se for o caso. */
  from?: number;
}

const BAR = 16;
const ICON = 52;

/** Chama do XP com a barra de nível: roxa, de pontas arredondadas, enchendo a cada avanço. */
export function XpBar({ xp, from }: Props) {
  const theme = useTheme();
  const now = xpProgress(xp);
  const start = xpProgress(from ?? xp);
  const fill = useRef(new Animated.Value(start.ratio)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const fire = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const move = (to: number, ms: number) =>
      Animated.timing(fill, { toValue: to, duration: ms, easing: Easing.out(Easing.cubic), useNativeDriver: false });

    if (now.level > start.level) {
      // Completa a barra e a chama pulsa. Aí o fogo pega em volta do símbolo e apaga,
      // com som, enquanto a barra recomeça no nível novo.
      let cancelled = false;
      Animated.sequence([
        move(1, 600),
        Animated.timing(pulse, { toValue: 1.25, duration: 160, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(async ({ finished }) => {
        if (!finished || cancelled) return;
        const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
        if (!reduce) {
          cue('fire');
          fire.setValue(0);
          Animated.timing(fire, { toValue: 1, duration: FIRE_MS, easing: Easing.linear, useNativeDriver: true }).start();
        }
        fill.setValue(0);
        move(now.ratio, 900).start();
      });
      return () => {
        cancelled = true;
      };
    }
    move(now.ratio, from === undefined ? 400 : 900).start();
    // Só reage a mudanças de XP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp, from]);

  return (
    <View
      accessible
      accessibilityLabel={`Nível ${now.level}, ${now.into} de ${now.needed} XP`}
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      <View style={{ width: ICON, height: ICON, zIndex: 2 }}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Image source={FLAME} style={{ width: ICON, height: ICON }} resizeMode="contain" />
        </Animated.View>
        <FireRing progress={fire} size={ICON} />
      </View>

      <View style={{ flex: 1, marginLeft: -14, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 20 }}>
          <Text variant="label" style={{ color: theme.xp }}>{`Nível ${now.level}`}</Text>
          <Text variant="caption" tone="muted">{`${now.into} / ${now.needed} XP`}</Text>
        </View>
        <View style={{ height: BAR, borderRadius: BAR / 2, backgroundColor: theme.xpSoft, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              borderRadius: BAR / 2,
              backgroundColor: theme.xp,
              width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          />
        </View>
      </View>
    </View>
  );
}
