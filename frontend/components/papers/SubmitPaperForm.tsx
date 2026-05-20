'use client';

import Link from 'next/link';
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { PaperAuthor } from '@/lib/types';
import type { PaperDraftFormValues } from '@/lib/validation';
import { CoAuthorsEditor } from '@/components/papers/CoAuthorsEditor';
import { PaperFileUpload } from '@/components/papers/PaperFileUpload';
import { ConferencePicker } from '@/components/conferences/ConferencePicker';
import { Input, Select, Textarea, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ConferenceTrack } from '@/lib/types';

interface SubmitPaperFormProps {
  control: Control<PaperDraftFormValues>;
  register: UseFormRegister<PaperDraftFormValues>;
  errors: FieldErrors<PaperDraftFormValues>;
  coAuthors: PaperAuthor[];
  onCoAuthorsChange: (authors: PaperAuthor[]) => void;
  canEditMeta: boolean;
  canSubmit: boolean;
  isRevision: boolean;
  paperId: string | null;
  existingPaperId: number | null;
  saving: boolean;
  success: string;
  autosaveHint?: string;
  tracks?: ConferenceTrack[];
  onSaveDraft: () => void;
  onSubmitPaper: () => void;
  onFileChange: (file: File | null) => void;
  hasExistingFile?: boolean;
}

export function SubmitPaperForm({
  control,
  register,
  errors,
  coAuthors,
  onCoAuthorsChange,
  canEditMeta,
  canSubmit,
  isRevision,
  paperId,
  existingPaperId,
  saving,
  success,
  autosaveHint,
  tracks = [],
  onSaveDraft,
  onSubmitPaper,
  onFileChange,
  hasExistingFile,
}: SubmitPaperFormProps) {
  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      {autosaveHint && <p className="mb-3 text-xs text-slate-500">{autosaveHint}</p>}
      <FormRequiredHint />
      <Controller
        name="conference_id"
        control={control}
        render={({ field }) => (
          <ConferencePicker
            value={field.value}
            onChange={field.onChange}
            disabled={!!paperId && !canEditMeta}
          />
        )}
      />
      {errors.conference_id?.message && <p className="text-xs text-red-600">{errors.conference_id.message}</p>}
      {tracks.length > 0 && (
        <Select label="Трек" disabled={!canEditMeta} error={errors.track_id?.message} {...register('track_id')}>
          <option value="">Выберите трек</option>
          {tracks.map((track) => (
            <option key={track.id} value={String(track.id)}>
              {track.name}
            </option>
          ))}
        </Select>
      )}
      <Input label="Название" required disabled={!canEditMeta} error={errors.title?.message} {...register('title')} />
      <Textarea
        label="Аннотация"
        rows={5}
        disabled={!canEditMeta}
        placeholder="Минимум 20 символов для подачи на рецензирование"
        error={errors.abstract?.message}
        {...register('abstract')}
      />
      <Input
        label="Ключевые слова"
        placeholder="через запятую"
        disabled={!canEditMeta}
        error={errors.keywords?.message}
        {...register('keywords')}
      />
      <CoAuthorsEditor value={coAuthors} onChange={onCoAuthorsChange} disabled={!canEditMeta} />

      {canSubmit && (
        <>
          <hr className="border-slate-200" />
          <PaperFileUpload onChange={onFileChange} hasExistingFile={hasExistingFile} />
        </>
      )}

      {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <nav className="flex flex-wrap gap-2">
        {canEditMeta && (
          <Button type="button" variant="secondary" disabled={saving} onClick={onSaveDraft}>
            {saving ? 'Сохранение...' : 'Сохранить черновик'}
          </Button>
        )}
        {canSubmit && (
          <Button type="button" disabled={saving} onClick={onSubmitPaper}>
            {saving ? 'Отправка...' : isRevision ? 'Загрузить PDF и отправить новую версию' : 'Загрузить PDF и подать'}
          </Button>
        )}
        {existingPaperId && (
          <Link href={`/papers/${existingPaperId}`}>
            <Button type="button" variant="ghost">
              К карточке статьи
            </Button>
          </Link>
        )}
        <Link href="/my-papers">
          <Button type="button" variant="ghost">
            Отмена
          </Button>
        </Link>
      </nav>
    </form>
  );
}
