import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ContentService } from './content.service';
import { ExerciseService } from './exercise.service';

/** Aceita só números entre 0 e 1; qualquer outra coisa é ignorada. */
function parseAccuracy(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : undefined;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly exercises: ExerciseService,
  ) {}

  @Get('tracks')
  listTracks(@CurrentUser() user: AuthUser) {
    return this.content.listTracks(user.id);
  }

  @Get('tracks/:slug')
  getTrack(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    return this.content.getTrack(slug, user.id);
  }

  /** `basic`: precisão recente do aluno em inglês básico (0 a 1), medida no app. */
  @Get('tracks/:slug/practice')
  practice(@Param('slug') slug: string, @CurrentUser() user: AuthUser, @Query('basic') basic?: string) {
    return this.exercises.buildPracticeSession(user.id, slug, parseAccuracy(basic));
  }

  @Get('lessons/:id/session')
  getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Query('basic') basic?: string,
  ) {
    return this.exercises.buildLessonSession(id, user.id, parseAccuracy(basic));
  }
}
