import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { argon2id, hash, verify } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schemas';

const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  interfaceLanguage: user.interfaceLanguage,
  timezone: user.timezone,
  profession: user.profession,
  targetLanguage: user.targetLanguage,
  level: user.level,
  dailyGoalMinutes: user.dailyGoalMinutes,
  remindersEnabled: user.remindersEnabled,
  onboardedAt: user.onboardedAt,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const passwordHash = await hash(input.password, { type: argon2id });
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          displayName: input.displayName,
          interfaceLanguage: input.interfaceLanguage,
          timezone: input.timezone,
          stats: { create: {} },
        },
      });
      return await this.openSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma conta com este e-mail');
      }
      throw error;
    }
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const valid = user ? await verify(user.passwordHash, input.password) : false;
    if (!user || !valid) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }
    return this.openSession(user);
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { completeOnboarding, ...fields } = input;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...fields,
        ...(completeOnboarding ? { onboardedAt: new Date() } : {}),
      },
    });
    return toPublicUser(user);
  }

  private async openSession(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      user: toPublicUser(user),
    };
  }
}
