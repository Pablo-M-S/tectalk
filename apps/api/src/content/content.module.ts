import { Module } from '@nestjs/common';
import { AudioModule } from '../audio/audio.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ExerciseService } from './exercise.service';

@Module({
  imports: [AudioModule],
  controllers: [ContentController],
  providers: [ContentService, ExerciseService],
  exports: [ExerciseService],
})
export class ContentModule {}
