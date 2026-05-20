import { z } from 'zod';
import { emptyToUndefined, optionalAmount, optionalText, required, splitCsv, toIso } from './shared';

export const conferenceFormSchema = z
  .object({
    title: required('Название'),
    short_name: optionalText,
    description: optionalText,
    topics: optionalText,
    start_date: required('Дата начала'),
    end_date: required('Дата окончания'),
    submission_deadline: required('Дедлайн подачи'),
    review_deadline: required('Дедлайн рецензий'),
    location: optionalText,
    format: z.enum(['offline', 'online', 'hybrid']),
    status: z
      .enum(['draft', 'pending_approval', 'submission_open', 'reviewing', 'programming', 'completed', 'rejected'])
      .optional(),
    registration_fee: optionalAmount,
    submission_fee: optionalAmount,
    fee_required: z.boolean().optional(),
    early_bird_fee: optionalAmount,
    early_bird_deadline: optionalText,
    review_mode: z.enum(['open', 'single_blind', 'double_blind']).optional(),
  })
  .refine((value) => value.start_date <= value.end_date, {
    path: ['end_date'],
    message: 'Дата окончания не может быть раньше даты начала',
  })
  .refine((value) => new Date(value.review_deadline) >= new Date(value.submission_deadline), {
    path: ['review_deadline'],
    message: 'Дедлайн рецензий не может быть раньше дедлайна подачи',
  });

export type ConferenceFormValues = z.infer<typeof conferenceFormSchema>;

export function toConferencePayload(values: ConferenceFormValues) {
  return {
    title: values.title.trim(),
    short_name: emptyToUndefined(values.short_name) ?? null,
    description: values.description || '',
    topics: splitCsv(values.topics),
    start_date: values.start_date,
    end_date: values.end_date,
    submission_deadline: toIso(values.submission_deadline),
    review_deadline: toIso(values.review_deadline),
    location: values.location || '',
    format: values.format,
    ...(values.status ? { status: values.status } : {}),
    registration_fee: values.registration_fee ? Number(values.registration_fee) : 0,
    submission_fee: values.submission_fee ? Number(values.submission_fee) : 0,
    fee_required: values.fee_required ?? false,
    early_bird_fee: values.early_bird_fee ? Number(values.early_bird_fee) : null,
    early_bird_deadline: values.early_bird_deadline ? toIso(values.early_bird_deadline) : null,
    review_mode: values.review_mode ?? 'open',
  };
}
