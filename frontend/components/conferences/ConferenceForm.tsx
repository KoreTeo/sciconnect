import type { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea, FormRequiredHint } from '@/components/ui/Input';
import type { ConferenceFormValues } from '@/lib/validation';

export function ConferenceForm({
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel,
  showFees = false,
}: {
  register: UseFormRegister<ConferenceFormValues>;
  handleSubmit: UseFormHandleSubmit<ConferenceFormValues>;
  errors: FieldErrors<ConferenceFormValues>;
  isSubmitting: boolean;
  onSubmit: SubmitHandler<ConferenceFormValues>;
  submitLabel: string;
  submittingLabel: string;
  showFees?: boolean;
}) {
  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormRequiredHint />
        <Input label="Название" required error={errors.title?.message} {...register('title')} />
        <Input label="Краткое имя (URL)" placeholder="iccs2026" error={errors.short_name?.message} {...register('short_name')} />
        <Textarea label="Описание" rows={4} error={errors.description?.message} {...register('description')} />
        <Input label="Тематики (через запятую)" error={errors.topics?.message} {...register('topics')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Дата начала" type="date" required error={errors.start_date?.message} {...register('start_date')} />
          <Input label="Дата окончания" type="date" required error={errors.end_date?.message} {...register('end_date')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Дедлайн подачи" type="datetime-local" required error={errors.submission_deadline?.message} {...register('submission_deadline')} />
          <Input label="Дедлайн рецензий" type="datetime-local" required error={errors.review_deadline?.message} {...register('review_deadline')} />
        </div>
        <Input label="Место проведения" error={errors.location?.message} {...register('location')} />
        {showFees && (
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium">Взносы (демо-оплата)</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('fee_required')} />
              Требовать оплату
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Взнос за регистрацию (₽)"
                type="number"
                min={0}
                error={errors.registration_fee?.message}
                {...register('registration_fee')}
              />
              <Input
                label="Взнос за подачу статьи (₽)"
                type="number"
                min={0}
                error={errors.submission_fee?.message}
                {...register('submission_fee')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Early bird взнос (₽)"
                type="number"
                min={0}
                error={errors.early_bird_fee?.message}
                {...register('early_bird_fee')}
              />
              <Input
                label="Early bird до"
                type="datetime-local"
                error={errors.early_bird_deadline?.message}
                {...register('early_bird_deadline')}
              />
            </div>
          </div>
        )}
        <Select label="Режим рецензирования" error={errors.review_mode?.message} {...register('review_mode')}>
          <option value="open">Открытое</option>
          <option value="single_blind">Single blind</option>
          <option value="double_blind">Double blind</option>
        </Select>
        <Select label="Формат" error={errors.format?.message} {...register('format')}>
          <option value="offline">Очно</option>
          <option value="online">Онлайн</option>
          <option value="hybrid">Гибрид</option>
        </Select>
        {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
