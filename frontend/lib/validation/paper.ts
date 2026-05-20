import { z } from 'zod';
import { optionalText, required, splitCsv } from './shared';

export const paperDraftSchema = z.object({
  conference_id: required('Конференция'),
  track_id: optionalText,
  title: z.string().trim().min(3, 'Укажите название (минимум 3 символа)'),
  abstract: optionalText,
  keywords: optionalText,
});

export const paperSubmitSchema = paperDraftSchema.extend({
  abstract: z.string().trim().min(20, 'Аннотация должна быть не короче 20 символов'),
});

export type PaperDraftFormValues = z.infer<typeof paperDraftSchema>;

export function toPaperPayload(values: PaperDraftFormValues) {
  return {
    title: values.title.trim(),
    abstract: values.abstract?.trim() || '',
    keywords: splitCsv(values.keywords),
    ...(values.track_id ? { track_id: Number(values.track_id) } : {}),
  };
}
