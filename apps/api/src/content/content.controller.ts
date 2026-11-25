import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ContentService } from './content.service';
import { ExerciseService } from './exercise.service';

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

  @Get('tracks/:slug/practice')
  practice(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    return this.exercises.buildPracticeSession(user.id, slug);
  }

  @Get('lessons/:id/session')
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercises.buildLessonSession(id);
  }
}
