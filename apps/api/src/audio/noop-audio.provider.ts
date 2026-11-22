import { Injectable, NotImplementedException } from '@nestjs/common';
import { AudioProvider } from './audio.provider';

@Injectable()
export class NoopAudioProvider implements AudioProvider {
  readonly enabled = false;

  async synthesize(): Promise<{ url: string }> {
    throw new NotImplementedException('Áudio ainda não está habilitado');
  }
}
