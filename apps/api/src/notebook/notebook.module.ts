import { Module } from '@nestjs/common';
import { ReviewModule } from '../review/review.module';
import { NotebookController } from './notebook.controller';
import { NotebookService } from './notebook.service';

@Module({
  imports: [ReviewModule],
  controllers: [NotebookController],
  providers: [NotebookService],
})
export class NotebookModule {}
