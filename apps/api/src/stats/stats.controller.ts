import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { StatsService } from './stats.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('stats')
  get(@CurrentUser() user: AuthUser) {
    return this.stats.get(user.id);
  }
}
