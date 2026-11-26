import { Image } from 'react-native';
import type { Language } from '@/api/types';

const ART: Partial<Record<Language, { src: number; ratio: number }>> = {
  EN: { src: require('../../assets/flags/us.webp'), ratio: 192 / 144 },
  ES: { src: require('../../assets/flags/es.webp'), ratio: 192 / 146 },
  PT: { src: require('../../assets/flags/br.webp'), ratio: 192 / 145 },
  JA: { src: require('../../assets/flags/jp.webp'), ratio: 192 / 140 },
  ZH: { src: require('../../assets/flags/cn.webp'), ratio: 192 / 139 },
  DE: { src: require('../../assets/flags/de.webp'), ratio: 192 / 138 },
};

/** Bandeira do idioma (decorativa). Sem arte para o idioma (ex.: FR) não renderiza nada. */
export function Flag({ code, height = 18 }: { code: Language; height?: number }) {
  const art = ART[code];
  if (!art) return null;
  return (
    <Image
      source={art.src}
      style={{ height, width: height * art.ratio }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
