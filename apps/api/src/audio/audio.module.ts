import { Module } from '@nestjs/common';
import { AUDIO_PROVIDER } from './audio.provider';
import { NoopAudioProvider } from './noop-audio.provider';

@Module({
  providers: [{ provide: AUDIO_PROVIDER, useClass: NoopAudioProvider }],
  exports: [AUDIO_PROVIDER],
})
export class AudioModule {}
