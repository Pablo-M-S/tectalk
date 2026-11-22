import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { localDate, shiftDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

export interface StatsSnapshot {
  xp: number;
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Soma XP e atualiza a ofensiva (streak) no fuso horário do usuário. */
  async registerActivity(
    tx: Prisma.TransactionClient,
    userId: string,
    xp: number,
    now: Date,
  ): Promise<StatsSnapshot> {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true, stats: true },
    });

    const today = localDate(now, user.timezone);
    const previous = user.stats;
    const lastActiveOn = previous?.lastActiveOn ?? null;

    let streak = previous?.currentStreak ?? 0;
    if (lastActiveOn !== today) {
      streak = lastActiveOn === shiftDate(today, -1) ? streak + 1 : 1;
    }
    const longestStreak = Math.max(previous?.longestStreak ?? 0, streak);

    const stats = await tx.userStats.upsert({
      where: { userId },
      create: { userId, xp, currentStreak: streak, longestStreak, lastActiveOn: today },
      update: {
        xp: { increment: xp },
        currentStreak: streak,
        longestStreak,
        lastActiveOn: today,
      },
    });

    return {
      xp: stats.xp,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    };
  }

  async get(userId: string): Promise<StatsSnapshot & { practicedToday: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true, stats: true },
    });

    const today = localDate(new Date(), user.timezone);
    const stats = user.stats;
    const lastActiveOn = stats?.lastActiveOn ?? null;
    const alive = lastActiveOn === today || lastActiveOn === shiftDate(today, -1);

    return {
      xp: stats?.xp ?? 0,
      currentStreak: alive ? (stats?.currentStreak ?? 0) : 0,
      longestStreak: stats?.longestStreak ?? 0,
      practicedToday: lastActiveOn === today,
    };
  }
}
