/**
 * Divisão de palavras em sílabas para o exercício de montar palavras (iniciante e básico).
 * É uma heurística: devolve `null` quando não há confiança, e o exercício simplesmente
 * não usa aquele termo.
 */

const LATIN_VOWELS = 'aeiouyáéíóúàâêôãõäöüAEIOUYÁÉÍÓÚÀÂÊÔÃÕÄÖÜ';
const isVowel = (ch: string) => LATIN_VOWELS.includes(ch);

/** Grupos de consoantes que podem abrir uma sílaba, por idioma. */
const ONSETS: Record<string, string[]> = {
  DE: [
    'schl', 'schm', 'schn', 'schr', 'schw', 'spr', 'str', 'sch', 'pfl', 'pfr', 'pf', 'ps', 'sp', 'st',
    'bl', 'br', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'pl', 'pr', 'tr', 'zw', 'qu', 'ch', 'sk',
  ],
  EN: ['str', 'spr', 'spl', 'scr', 'thr', 'sch', 'shr', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'ch', 'sh', 'th', 'ph', 'wh'],
  ES: ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr'],
};

/** Letras que formam um único som e não podem ser separadas. */
const DIGRAPHS: Record<string, string[]> = {
  DE: ['sch', 'ch', 'ck', 'ph', 'th', 'qu'],
  EN: ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'ng', 'qu'],
  ES: ['ch', 'll', 'rr', 'qu', 'gu'],
};

/** Vogais que formam um único núcleo silábico. */
const NUCLEI: Record<string, string[]> = {
  DE: ['ei', 'ie', 'eu', 'äu', 'au', 'ai', 'aa', 'ee', 'oo'],
  EN: ['ea', 'ee', 'oo', 'ou', 'oa', 'ai', 'ay', 'ei', 'ey', 'oi', 'oy', 'au', 'aw', 'ie', 'ue', 'ow'],
  ES: ['ia', 'ie', 'io', 'iu', 'ua', 'ue', 'ui', 'uo', 'ai', 'ei', 'oi', 'au', 'eu', 'ou', 'ay', 'ey', 'oy'],
};

const STRONG = 'aeoáéó';
const WEAK = 'iuü';
const ACCENTED_WEAK = 'íú';
/** Ditongo do espanhol: vogal fraca átona junto de outra vogal. Vogal fraca tônica (í, ú) ou duas fortes formam hiato. */
function spanishDiphthong(a: string, b: string): boolean {
  if (ACCENTED_WEAK.includes(a) || ACCENTED_WEAK.includes(b)) return false;
  if (STRONG.includes(a) && STRONG.includes(b)) return false;
  return (WEAK.includes(a) && (STRONG.includes(b) || WEAK.includes(b))) || (STRONG.includes(a) && WEAK.includes(b));
}

function latinSyllables(word: string, language: 'DE' | 'EN' | 'ES'): string[] | null {
  const lower = word.toLowerCase();
  if (!/^[a-zäöüßáéíóúñàâêôãõç-]+$/i.test(lower) || lower.includes('-')) return null;

  // 1) Núcleos vocálicos: posição inicial e final de cada grupo de vogais.
  const nuclei: [number, number][] = [];
  for (let i = 0; i < lower.length; ) {
    if (!isVowel(lower[i])) {
      i += 1;
      continue;
    }
    let end = i + 1;
    const pair = lower.slice(i, i + 2);
    if (language === 'ES') {
      if (end < lower.length && isVowel(lower[end]) && spanishDiphthong(lower[i], lower[end])) end += 1;
    } else if (NUCLEI[language].includes(pair)) {
      end = i + 2;
    }
    // Inglês: "-tion", "-sion", "-cian" têm uma só sílaba.
    if (language === 'EN' && /^[io][ao]$/.test(pair) && /[tsc]/.test(lower[i - 1] ?? '') && /^(n|us)/.test(lower.slice(i + 2))) {
      end = i + 2;
    }
    nuclei.push([i, end]);
    i = end;
  }
  // "e" final mudo do inglês ("valve") não é uma sílaba.
  if (language === 'EN' && nuclei.length > 1) {
    const [start, end] = nuclei[nuclei.length - 1];
    if (end === lower.length && lower.slice(start, end) === 'e' && !isVowel(lower[start - 1] ?? 'a')) {
      nuclei.pop();
    }
  }
  if (nuclei.length < 2) return null;

  // 2) Entre dois núcleos, as consoantes se dividem: o maior grupo que pode abrir sílaba vai para a seguinte.
  const cuts: number[] = [];
  for (let n = 0; n < nuclei.length - 1; n++) {
    const from = nuclei[n][1];
    const to = nuclei[n + 1][0];
    const cluster = lower.slice(from, to);
    if (cluster.length === 0) {
      cuts.push(to);
      continue;
    }
    let cut = to - 1; // por padrão, só a última consoante passa para a próxima sílaba
    if (language === 'EN' && lower.slice(to) === 'ing') {
      cut = to; // "render-ing", "scaffold-ing"
    } else if (cluster.length === 1) {
      cut = from;
    } else {
      for (let size = Math.min(cluster.length, 4); size >= 1; size--) {
        const tail = cluster.slice(cluster.length - size);
        const single = size === 1;
        const digraph = DIGRAPHS[language].includes(tail);
        if (single || digraph || ONSETS[language].includes(tail)) {
          cut = to - size;
          break;
        }
      }
      // Não separa dígrafos ao meio ("ck", "ch", "sh"...).
      for (const digraph of DIGRAPHS[language]) {
        const at = lower.indexOf(digraph, from - 1);
        if (at >= 0 && at < cut && at + digraph.length > cut && at >= from - 1) cut = at;
      }
    }
    cuts.push(cut);
  }

  const parts: string[] = [];
  let last = 0;
  for (const cut of cuts) {
    parts.push(word.slice(last, cut));
    last = cut;
  }
  parts.push(word.slice(last));
  return parts.every((p) => p.length > 0 && [...p.toLowerCase()].some(isVowel)) ? parts : null;
}

const KANA_SMALL = 'ゃゅょぁぃぅぇぉャュョァィゥェォ';
const isCjk = (ch: string) => /[぀-ヿ㐀-鿿]/.test(ch);

/** Japonês e chinês: cada caractere é uma sílaba; no katakana, cada mora (kana + pequenos + ー). */
function cjkSyllables(word: string): string[] | null {
  const chars = [...word];
  if (!chars.every(isCjk)) return null;
  const parts: string[] = [];
  for (const ch of chars) {
    if ((ch === 'ー' || KANA_SMALL.includes(ch)) && parts.length > 0) parts[parts.length - 1] += ch;
    else parts.push(ch);
  }
  return parts;
}

export function syllabify(word: string, language: string): string[] | null {
  const text = word.trim();
  if (!text || /\s/.test(text)) return null;
  const parts =
    language === 'JA' || language === 'ZH'
      ? cjkSyllables(text)
      : language === 'DE' || language === 'EN' || language === 'ES'
        ? latinSyllables(text, language)
        : null;
  return parts && parts.length >= 2 && parts.length <= 5 && parts.join('') === text ? parts : null;
}
