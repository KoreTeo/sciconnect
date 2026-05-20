import { z } from 'zod';
import { optionalText, required } from './shared';

export const reviewSchema = z.object({
  score_relevance: z.number().min(1).max(5),
  score_novelty: z.number().min(1).max(5),
  score_clarity: z.number().min(1).max(5),
  score_methodology: z.number().min(1).max(5),
  comment_for_author: required('Комментарий автору'),
  comment_for_chair: optionalText,
  recommendation: z.enum(['accept', 'minor_revision', 'major_revision', 'reject']),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
