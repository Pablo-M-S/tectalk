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
  eng: {
    apontando: { source: require('../../assets/characters/eng-apontando.webp'), ratio: 413 / 640 },
    bracos: { source: require('../../assets/characters/eng-bracos.webp'), ratio: 293 / 640 },
    lendo: { source: require('../../assets/characters/eng-lendo.webp'), ratio: 386 / 640 },
    oculos: { source: require('../../assets/characters/eng-oculos.webp'), ratio: 379 / 640 },
  },
  obra: {
    chapeu: { source: require('../../assets/characters/obra-chapeu.webp'), ratio: 390 / 640 },
    martelo: { source: require('../../assets/characters/obra-martelo.webp'), ratio: 413 / 640 },
    prancheta: { source: require('../../assets/characters/obra-prancheta.webp'), ratio: 396 / 640 },
  },
  adv: {
    advogado: { source: require('../../assets/characters/dir-advogado.webp'), ratio: 424 / 640 },
    advogada: { source: require('../../assets/characters/dir-advogada.webp'), ratio: 355 / 640 },
    grisalho: { source: require('../../assets/characters/dir-grisalho.webp'), ratio: 333 / 640 },
    colete: { source: require('../../assets/characters/dir-colete.webp'), ratio: 410 / 640 },
  },
  cien: {
    frasco: { source: require('../../assets/characters/cie-frasco.webp'), ratio: 384 / 640 },
    pensando: { source: require('../../assets/characters/cie-pensando.webp'), ratio: 311 / 640 },
    oculos: { source: require('../../assets/characters/cie-oculos.webp'), ratio: 389 / 640 },
    coque: { source: require('../../assets/characters/cie-coque.webp'), ratio: 281 / 640 },
  },
  arq: {
    planta: { source: require('../../assets/characters/arq-planta.webp'), ratio: 399 / 640 },
    capacete: { source: require('../../assets/characters/arq-capacete.webp'), ratio: 349 / 640 },
    apontando: { source: require('../../assets/characters/arq-apontando.webp'), ratio: 401 / 640 },
    grisalho: { source: require('../../assets/characters/arq-grisalho.webp'), ratio: 329 / 640 },
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
  engenharia: {
    intro: ART.eng.apontando,
    loading: ART.eng.lendo,
    right: ART.eng.oculos,
    wrong: ART.eng.lendo,
    great: ART.eng.bracos,
    good: ART.eng.oculos,
    bad: ART.eng.lendo,
  },
  construcao: {
    intro: ART.obra.chapeu,
    loading: ART.obra.prancheta,
    right: ART.obra.martelo,
    wrong: ART.obra.prancheta,
    great: ART.obra.chapeu,
    good: ART.obra.martelo,
    bad: ART.obra.prancheta,
  },
  direito: {
    intro: ART.adv.advogado,
    loading: ART.adv.advogada,
    right: ART.adv.colete,
    wrong: ART.adv.grisalho,
    great: ART.adv.advogado,
    good: ART.adv.colete,
    bad: ART.adv.grisalho,
  },
  ciencia: {
    intro: ART.cien.frasco,
    loading: ART.cien.pensando,
    right: ART.cien.oculos,
    wrong: ART.cien.coque,
    great: ART.cien.frasco,
    good: ART.cien.oculos,
    bad: ART.cien.coque,
  },
  arquitetura: {
    intro: ART.arq.apontando,
    loading: ART.arq.capacete,
    right: ART.arq.planta,
    wrong: ART.arq.grisalho,
    great: ART.arq.apontando,
    good: ART.arq.planta,
    bad: ART.arq.grisalho,
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
