'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFieldArray, useForm, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Paper } from '@/lib/types';
import { useConferenceProgramMutations } from '@/hooks/useConferenceProgramMutations';
import { useConferencePapers, useConferenceProgram } from '@/lib/queries';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select, Textarea, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { QueryState } from '@/components/ui/QueryState';
import {
  programFormSchema,
  type ProgramFormValues,
} from '@/lib/validation';

const emptyProgram: ProgramFormValues = { sessions: [] };
const fmt = (value: string | Date) => new Date(value).toISOString().slice(0, 16);

function ProgramEditor() {
  const { id } = useParams();
  const toast = useToast();
  const programQuery = useConferenceProgram(id as string);
  const acceptedPapersQuery = useConferencePapers(id as string, { status: 'accepted' });
  const acceptedPapers = acceptedPapersQuery.data || [];
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: emptyProgram,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'sessions' });

  useEffect(() => {
    if (programQuery.data) {
      reset({
        sessions: programQuery.data.map((s) => ({
          title: s.title,
          description: s.description || '',
          room: s.room || '',
          start_time: s.start_time?.slice(0, 16) || '',
          end_time: s.end_time?.slice(0, 16) || '',
          items: (s.items || []).map((item, idx) => ({
            title: item.title,
            authors: item.authors || '',
            start_time: item.start_time.slice(0, 16),
            end_time: item.end_time.slice(0, 16),
            paper_id: item.paper_id ? String(item.paper_id) : '',
            order: item.order ?? idx,
          })),
        })),
      });
    }
  }, [programQuery.data, reset]);

  const saveProgramMutation = useConferenceProgramMutations(id as string);

  const saveAll = async (values: ProgramFormValues) => {
    await saveProgramMutation.mutateAsync(values);
    toast.success('Программа сохранена');
  };

  const addSession = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(start.getTime() + 7200000);
    append({ title: 'Новая секция', description: '', room: '', start_time: fmt(start), end_time: fmt(end), items: [] });
  };

  return (
    <QueryState loading={programQuery.isLoading || acceptedPapersQuery.isLoading} error={programQuery.error || acceptedPapersQuery.error}>
      <PageHeader title="Программа конференции" breadcrumbs={[{ label: 'Управление', href: `/conference-manage/${id}` }, { label: 'Программа' }]} />
      <nav className="mb-6 flex gap-2">
        <Button type="button" onClick={addSession}>Добавить секцию</Button>
        <Button variant="secondary" onClick={handleSubmit(saveAll)} disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить программу'}
        </Button>
      </nav>
      <FormRequiredHint className="mb-4" />
      {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
      <ul className="space-y-6">
        {fields.map((field, si) => (
          <SessionFields
            key={field.id}
            index={si}
            control={control}
            register={register}
            errors={errors}
            acceptedPapers={acceptedPapers}
            onRemove={() => remove(si)}
          />
        ))}
      </ul>
    </QueryState>
  );
}

function SessionFields({
  index,
  control,
  register,
  errors,
  acceptedPapers,
  onRemove,
}: {
  index: number;
  control: Control<ProgramFormValues>;
  register: UseFormRegister<ProgramFormValues>;
  errors: FieldErrors<ProgramFormValues>;
  acceptedPapers: Paper[];
  onRemove: () => void;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `sessions.${index}.items` });
  const sessionErrors = errors.sessions?.[index];

  return (
    <li>
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Input label="Название секции" required error={sessionErrors?.title?.message} {...register(`sessions.${index}.title`)} />
          <Input label="Зал" error={sessionErrors?.room?.message} {...register(`sessions.${index}.room`)} />
          <Textarea label="Описание" rows={2} className="sm:col-span-2" error={sessionErrors?.description?.message} {...register(`sessions.${index}.description`)} />
          <Input label="Начало" type="datetime-local" error={sessionErrors?.start_time?.message} {...register(`sessions.${index}.start_time`)} />
          <Input label="Конец" type="datetime-local" error={sessionErrors?.end_time?.message} {...register(`sessions.${index}.end_time`)} />
        </div>
        <Button type="button" variant="ghost" onClick={onRemove}>Удалить секцию</Button>
        <h4 className="mb-2 mt-4 font-medium">Доклады</h4>
        {fields.map((item, ii) => {
          const itemErrors = sessionErrors?.items?.[ii];
          return (
            <article key={item.id} className="mb-3 rounded border p-3">
              <Input label="Название" error={itemErrors?.title?.message} {...register(`sessions.${index}.items.${ii}.title`)} />
              <Input label="Авторы" error={itemErrors?.authors?.message} {...register(`sessions.${index}.items.${ii}.authors`)} />
              <Select label="Статья" error={itemErrors?.paper_id?.message} {...register(`sessions.${index}.items.${ii}.paper_id`)}>
                <option value="">—</option>
                {acceptedPapers.map((paper) => <option key={paper.id} value={paper.id}>{paper.title}</option>)}
              </Select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input type="datetime-local" error={itemErrors?.start_time?.message} {...register(`sessions.${index}.items.${ii}.start_time`)} />
                <Input type="datetime-local" error={itemErrors?.end_time?.message} {...register(`sessions.${index}.items.${ii}.end_time`)} />
              </div>
              <Button type="button" variant="ghost" className="mt-2" onClick={() => remove(ii)}>Удалить доклад</Button>
            </article>
          );
        })}
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
            append({ title: '', authors: '', start_time: fmt(startDate), end_time: fmt(endDate), paper_id: '', order: fields.length });
          }}
        >
          + Доклад
        </Button>
      </Card>
    </li>
  );
}

export default function ConferenceProgramPage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <ProgramEditor />
    </RequireAuth>
  );
}

