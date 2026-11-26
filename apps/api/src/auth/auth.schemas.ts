import { Language, ProficiencyLevel } from '@prisma/client';
import { z } from 'zod';

const timezone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Fuso horário inválido');

const email = z.string().trim().toLowerCase().email('E-mail inválido').max(254);

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, 'A senha precisa ter ao menos 8 caracteres')
    .max(128, 'A senha pode ter no máximo 128 caracteres'),
  displayName: z.string().trim().min(2, 'Informe seu nome').max(60),
  interfaceLanguage: z.nativeEnum(Language).default(Language.PT),
  timezone: timezone.default('America/Sao_Paulo'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome').max(60).optional(),
  profession: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z-]{1,29}$/, 'Profissão inválida')
    .nullable()
    .optional(),
  targetLanguage: z.nativeEnum(Language).optional(),
  level: z.nativeEnum(ProficiencyLevel).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(180).optional(),
  remindersEnabled: z.boolean().optional(),
  /** Marca o onboarding como concluído. */
  completeOnboarding: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
