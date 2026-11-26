import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MasterInput, masterSchema, TouchInput, touchSchema } from './notebook.schemas';
import { NotebookService } from './notebook.service';

@Controller('notebook/:trackSlug')
@UseGuards(JwtAuthGuard)
export class NotebookController {
  constructor(private readonly notebook: NotebookService) {}

  @Get()
  state(@CurrentUser() user: AuthUser, @Param('trackSlug') trackSlug: string) {
    return this.notebook.state(user.id, trackSlug);
  }

  @Post('touch')
  @HttpCode(200)
  touch(
    @CurrentUser() user: AuthUser,
    @Param('trackSlug') trackSlug: string,
    @Body(new ZodValidationPipe(touchSchema)) body: TouchInput,
  ) {
    return this.notebook.touch(user.id, trackSlug, body);
  }

  @Post('master')
  @HttpCode(200)
  master(
    @CurrentUser() user: AuthUser,
    @Param('trackSlug') trackSlug: string,
    @Body(new ZodValidationPipe(masterSchema)) body: MasterInput,
  ) {
    return this.notebook.master(user.id, trackSlug, body.termId);
  }
}
