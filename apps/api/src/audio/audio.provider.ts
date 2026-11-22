import { Language } from '@prisma/client';

export const AUDIO_PROVIDER = Symbol('AUDIO_PROVIDER');

export interface AudioSynthesisInput {
  text: string;
  language: Language;
}

/**
 * Contrato do áudio. O MVP roda com NoopAudioProvider (desligado).
 * Para ativar: implementar esta interface (TTS + storage), registrar em
 * AudioModule e definir AUDIO_ENABLED=true.
 */
export interface AudioProvider {
  readonly enabled: boolean;
  synthesize(input: AudioSynthesisInput): Promise<{ url: string }>;
}
