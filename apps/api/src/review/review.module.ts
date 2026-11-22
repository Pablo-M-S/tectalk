import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { StatsModule } from '../stats/stats.module';
import { FsrsService } from './fsrs.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [ContentModule, StatsModule],
  controllers: [ReviewController],
  providers: [ReviewService, FsrsService],
  exports: [ReviewService],
})
export class ReviewModule {}
