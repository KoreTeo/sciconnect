import { z } from 'zod';
import { emptyToUndefined, optionalText, required, toIso } from './shared';

const programItemSchema = z
  .object({
    title: required('Название доклада'),
    authors: optionalText,
    start_time: required('Начало доклада'),
    end_time: required('Конец доклада'),
    paper_id: optionalText,
    order: z.number(),
  })
  .refine((value) => new Date(value.end_time) > new Date(value.start_time), {
    path: ['end_time'],
    message: 'Доклад должен заканчиваться позже начала',
  });

const programSessionSchema = z
  .object({
    title: required('Название секции'),
    description: optionalText,
    room: optionalText,
    start_time: required('Начало секции'),
    end_time: required('Конец секции'),
    items: z.array(programItemSchema),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.start_time);
    const end = new Date(value.end_time);
    if (end <= start) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_time'],
        message: 'Секция должна заканчиваться позже начала',
      });
    }
    value.items.forEach((item, index) => {
      const itemStart = new Date(item.start_time);
      const itemEnd = new Date(item.end_time);
      if (itemStart < start || itemEnd > end) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'start_time'],
          message: 'Доклад должен быть внутри времени секции',
        });
      }
    });
  });

export const programFormSchema = z.object({
  sessions: z.array(programSessionSchema),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

export function toProgramPayload(values: ProgramFormValues) {
  return values.sessions.map((session) => ({
    title: session.title,
    description: emptyToUndefined(session.description) ?? null,
    room: emptyToUndefined(session.room) ?? null,
    start_time: toIso(session.start_time),
    end_time: toIso(session.end_time),
    items: session.items.map((item, index) => ({
      title: item.title,
      authors: emptyToUndefined(item.authors) ?? null,
      start_time: toIso(item.start_time),
      end_time: toIso(item.end_time),
      paper_id: item.paper_id ? Number(item.paper_id) : null,
      order: item.order ?? index,
    })),
  }));
}
