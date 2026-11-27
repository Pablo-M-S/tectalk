import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SubmitResultsInput, submitResultsSchema } from '../review/review.schemas';
import { ProgressService } from './progress.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('lessons/:id/complete')
  @HttpCode(200)
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(submitResultsSchema)) body: SubmitResultsInput,
  ) {
    return this.progress.completeLesson(user.id, id, body.results);
  }

  @Post('levels/:id/complete')
  @HttpCode(200)
  completeLevel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(submitResultsSchema)) body: SubmitResultsInput,
  ) {
    return this.progress.completeLevel(user.id, id, body.results);
  }
}
