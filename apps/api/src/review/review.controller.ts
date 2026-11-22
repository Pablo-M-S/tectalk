import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  DueQuery,
  dueQuerySchema,
  SubmitResultsInput,
  submitResultsSchema,
} from './review.schemas';
import { ReviewService } from './review.service';

@Controller('reviews/:trackSlug')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get('due')
  due(
    @CurrentUser() user: AuthUser,
    @Param('trackSlug') trackSlug: string,
    @Query(new ZodValidationPipe(dueQuerySchema)) query: DueQuery,
  ) {
    return this.reviews.due(user.id, trackSlug, query.limit);
  }

  @Post('submit')
  @HttpCode(200)
  submit(
    @CurrentUser() user: AuthUser,
    @Param('trackSlug') trackSlug: string,
    @Body(new ZodValidationPipe(submitResultsSchema)) body: SubmitResultsInput,
  ) {
    return this.reviews.submit(user.id, trackSlug, body.results);
  }
}
