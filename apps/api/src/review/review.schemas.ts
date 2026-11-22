import { z } from 'zod';

export const resultSchema = z.object({
  termId: z.string().uuid(),
  correct: z.boolean(),
});

export const submitResultsSchema = z.object({
  results: z.array(resultSchema).min(1).max(100),
});

export const dueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

export type ExerciseResult = z.infer<typeof resultSchema>;
export type SubmitResultsInput = z.infer<typeof submitResultsSchema>;
export type DueQuery = z.infer<typeof dueQuerySchema>;
