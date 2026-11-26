import { Image, View, type ImageSourcePropType } from 'react-native';
import { useActiveTrack } from '@/api/hooks';
import { useTheme } from '@/theme/theme';

type Art = { source: ImageSourcePropType; ratio: number };

/** Arte já recortada; ratio = largura / altura. */
const ART = {
  medico: {
    apresentando: { source: require('../../assets/characters/medico-apresentando.webp'), ratio: 447 / 640 },
    lendo: { source: require('../../assets/characters/medico-lendo.webp'), ratio: 413 / 640 },
    escrevendo: { source: require('../../assets/characters/medico-escrevendo.webp'), ratio: 290 / 640 },
    bracosCruzados: { source: require('../../assets/characters/medico-bracos-cruzados.webp'), ratio: 223 / 640 },
    pensando: { source: require('../../assets/characters/medico-pensando.webp'), ratio: 245 / 640 },
  },
  dev: {
    sorrindo: { source: require('../../assets/characters/dev-sorrindo.webp'), ratio: 524 / 640 },
    sentado: { source: require('../../assets/characters/dev-sentado.webp'), ratio: 600 / 640 },
    joinha: { source: require('../../assets/characters/dev-joinha.webp'), ratio: 371 / 640 },
    fone: { source: require('../../assets/characters/dev-fone-notebook.webp'), ratio: 500 / 640 },
  },
} satisfies Record<string, Record<string, Art>>;

/** Papel do personagem na tela; cada profissão escolhe a arte que representa o papel. */
export type MascotRole = 'intro' | 'loading' | 'right' | 'wrong' | 'great' | 'good' | 'bad';

const CAST: Record<string, Record<MascotRole, Art>> = {
  medicina: {
    intro: ART.medico.apresentando,
    loading: ART.medico.lendo,
    right: ART.medico.escrevendo,
    wrong: ART.medico.pensando,
    great: ART.medico.bracosCruzados,
    good: ART.medico.escrevendo,
    bad: ART.medico.pensando,
  },
  programacao: {
    intro: ART.dev.sorrindo,
    loading: ART.dev.sentado,
    right: ART.dev.joinha,
    wrong: ART.dev.fone,
    great: ART.dev.sorrindo,
    good: ART.dev.joinha,
    bad: ART.dev.fone,
  },
};

/** Só profissões com elenco próprio têm personagens. */
export function useMascots(): boolean {
  const profession = useActiveTrack().summary?.profession;
  return profession !== undefined && profession in CAST;
}

interface Props {
  role: MascotRole;
  /** Altura da arte inteira. */
  height: number;
  /** Fração de cima da arte que fica visível (1 = inteira). Útil para "espiar" sobre uma borda. */
  visible?: number;
  /** Círculo suave atrás, para o jaleco branco não se perder no tema claro. */
  halo?: boolean;
}

/** Personagem do app. Não renderiza nada em trilhas sem elenco. */
export function Mascot({ role, height, visible = 1, halo = false }: Props) {
  const theme = useTheme();
  const profession = useActiveTrack().summary?.profession;
  const art = profession ? CAST[profession]?.[role] : undefined;
  if (!art) return null;

  const { source, ratio } = art;
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
