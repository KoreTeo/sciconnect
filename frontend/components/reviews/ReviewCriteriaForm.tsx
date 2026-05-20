'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Textarea, Select } from '@/components/ui/Input';
import { RECOMMENDATION_LABELS } from '@/lib/types';
import type { ReviewFormValues } from '@/lib/validation';

const CRITERIA = [
  { key: 'score_relevance' as const, label: 'Актуальность' },
  { key: 'score_novelty' as const, label: 'Новизна' },
  { key: 'score_clarity' as const, label: 'Ясность' },
  { key: 'score_methodology' as const, label: 'Методология' },
];

export function ReviewCriteriaForm({
  register,
  errors,
  disabled,
  scores,
}: {
  register: UseFormRegister<ReviewFormValues>;
  errors: FieldErrors<ReviewFormValues>;
  disabled?: boolean;
  scores: number[];
}) {
  const average = scores.reduce((sum, score) => sum + (Number(score) || 0), 0) / scores.length;

  return (
    <div className="space-y-4">
      {CRITERIA.map(({ key, label }) => (
        <fieldset key={key} disabled={disabled} className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-800">
            {label} <span className="text-red-600" aria-hidden="true">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="inline-flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  value={value}
                  disabled={disabled}
                  className="accent-brand-600"
                  {...register(key, { valueAsNumber: true })}
                />
                {value}
              </label>
            ))}
          </div>
          {errors[key]?.message && <p className="mt-1 text-xs text-red-600">{errors[key]?.message}</p>}
        </fieldset>
      ))}
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        Средняя оценка по критериям: <strong>{average.toFixed(1)}</strong> / 5
      </div>
      <Textarea
        label="Комментарий автору"
        disabled={disabled}
        rows={4}
        error={errors.comment_for_author?.message}
        {...register('comment_for_author')}
      />
      <Textarea
        label="Комментарий председателю"
        disabled={disabled}
        rows={3}
        error={errors.comment_for_chair?.message}
        {...register('comment_for_chair')}
      />
      <Select label="Рекомендация" required disabled={disabled} error={errors.recommendation?.message} {...register('recommendation')}>
        {Object.entries(RECOMMENDATION_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
    </div>
  );
}
