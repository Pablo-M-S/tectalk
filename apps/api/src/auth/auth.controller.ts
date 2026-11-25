import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
  UpdateProfileInput,
  updateProfileSchema,
} from './auth.schemas';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.profile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.auth.updateProfile(user.id, body);
  }
}
