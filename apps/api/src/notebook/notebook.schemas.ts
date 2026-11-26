import { z } from 'zod';

export const touchSchema = z.object({
  termId: z.string().uuid(),
  answer: z.string().max(120),
});

export const masterSchema = z.object({
  termId: z.string().uuid(),
});

export type TouchInput = z.infer<typeof touchSchema>;
export type MasterInput = z.infer<typeof masterSchema>;
