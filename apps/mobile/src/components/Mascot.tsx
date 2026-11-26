import { Image, View, type ImageSourcePropType } from 'react-native';
import { useActiveTrack } from '@/api/hooks';
import { useTheme } from '@/theme/theme';

/** Proporção (largura / altura) de cada arte, já recortada. */
const POSES = {
  apresentando: { source: require('../../assets/characters/medico-apresentando.webp') as ImageSourcePropType, ratio: 447 / 640 },
  lendo: { source: require('../../assets/characters/medico-lendo.webp') as ImageSourcePropType, ratio: 413 / 640 },
  escrevendo: { source: require('../../assets/characters/medico-escrevendo.webp') as ImageSourcePropType, ratio: 290 / 640 },
  bracosCruzados: { source: require('../../assets/characters/medico-bracos-cruzados.webp') as ImageSourcePropType, ratio: 223 / 640 },
  pensando: { source: require('../../assets/characters/medico-pensando.webp') as ImageSourcePropType, ratio: 245 / 640 },
} as const;

export type MascotPose = keyof typeof POSES;

/** Os personagens existentes são médicos: só aparecem no ensino de Medicina. */
export function useMascots(): boolean {
  return useActiveTrack().summary?.profession === 'medicina';
}

interface Props {
  pose: MascotPose;
  /** Altura da arte inteira. */
  height: number;
  /** Fração de cima da arte que fica visível (1 = inteira). Útil para "espiar" sobre uma borda. */
  visible?: number;
  /** Círculo suave atrás, para o jaleco branco não se perder no tema claro. */
  halo?: boolean;
}

/** Personagem do app. Não renderiza nada fora da trilha de Medicina. */
export function Mascot({ pose, height, visible = 1, halo = false }: Props) {
  const theme = useTheme();
  const enabled = useMascots();
  if (!enabled) return null;

  const { source, ratio } = POSES[pose];
  const width = height * ratio;
  const shown = height * visible;
  const diameter = Math.max(width, shown) * 1.15;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ width: Math.max(width, diameter), height: shown, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {halo ? (
        <View
          style={{
            position: 'absolute',
            bottom: -diameter * 0.2,
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: theme.primarySoft,
          }}
        />
      ) : null}
      <View style={{ width, height: shown, overflow: 'hidden' }}>
        <Image source={source} style={{ width, height }} resizeMode="contain" />
      </View>
    </View>
  );
}
