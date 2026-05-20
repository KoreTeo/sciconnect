'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Paper, PaperAuthor } from '@/lib/types';
import { usePaperSubmission } from '@/hooks/usePaperSubmission';
import { useSubmitPaperFlow } from '@/hooks/useSubmitPaperFlow';
import { useConference, useConferenceTracks, usePaper } from '@/lib/queries';
import { getSubmissionStep } from '@/lib/submitPaperStep';
import { getApiErrorMessage, isEmailNotVerifiedError } from '@/lib/errors';
import { paperDraftSchema, type PaperDraftFormValues } from '@/lib/validation';

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useSubmitPaperPageState() {
  const router = useRouter();
  const params = useSearchParams();
  const paperId = params.get('paperId');
  const conferenceIdParam = params.get('conferenceId');
  const paymentStep = params.get('step') === 'payment';
  const paperQuery = usePaper(paperId || undefined);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors },
  } = useForm<PaperDraftFormValues>({
    resolver: zodResolver(paperDraftSchema),
    defaultValues: {
      conference_id: conferenceIdParam || '',
      track_id: '',
      title: '',
      abstract: '',
      keywords: '',
    },
  });
  const [file, setFile] = useState<File | null>(null);
  const [existingPaperId, setExistingPaperId] = useState<number | null>(paperId ? Number(paperId) : null);
  const [paperStatus, setPaperStatus] = useState<string>('draft');
  const [paperFileUrl, setPaperFileUrl] = useState<string | undefined>();
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [coAuthors, setCoAuthors] = useState<PaperAuthor[]>([]);
  const autosaveSkip = useRef(true);
  const watchedValues = useWatch({ control });
  const selectedConferenceId = watchedValues.conference_id || conferenceIdParam || '';
  const conferenceQuery = useConference(selectedConferenceId || undefined);
  const tracksQuery = useConferenceTracks(selectedConferenceId || undefined, !!selectedConferenceId);
  const paper = paperQuery.data;
  const conference = conferenceQuery.data;
  const tracks = tracksQuery.data || [];

  const { runSubmit } = useSubmitPaperFlow({
    conferenceId: selectedConferenceId || undefined,
    conference,
    onError: (message) => setError('root', { message }),
  });

  useEffect(() => {
    if (!paper) return;
    setExistingPaperId(paper.id);
    reset({
      conference_id: String(paper.conference_id),
      track_id: paper.track_id ? String(paper.track_id) : '',
      title: paper.title,
      abstract: paper.abstract,
      keywords: (paper.keywords || []).join(', '),
    });
    setPaperStatus(paper.status);
    setPaperFileUrl(paper.file_url);
    setCoAuthors(paper.co_authors || []);
    autosaveSkip.current = true;
  }, [paper, reset]);

  useEffect(() => {
    if (paperQuery.error) setError('root', { message: 'Не удалось загрузить статью' });
  }, [paperQuery.error, setError]);

  const saveDraftMutation = usePaperSubmission(existingPaperId, coAuthors);

  const saveDraft = useCallback(
    async (values: PaperDraftFormValues, options?: { silent?: boolean }): Promise<number> => {
      if (!options?.silent) setSaving(true);
      else setAutosaveState('saving');
      try {
        const pid = await saveDraftMutation.mutateAsync(values);
        setExistingPaperId(pid);
        if (options?.silent) setAutosaveState('saved');
        return pid;
      } catch (err) {
        if (options?.silent) {
          setAutosaveState('error');
        } else if (isEmailNotVerifiedError(err)) {
          setError('root', { message: getApiErrorMessage(err) });
        } else {
          setError('root', { message: getApiErrorMessage(err, 'Ошибка сохранения черновика') });
        }
        throw err;
      } finally {
        if (!options?.silent) setSaving(false);
      }
    },
    [saveDraftMutation, setError]
  );

  useEffect(() => {
    if (!existingPaperId || paperStatus === 'submitted' || paperStatus === 'under_review') return;
    if (autosaveSkip.current) {
      autosaveSkip.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const values = getValues();
      if (!values.title?.trim() && !values.abstract?.trim()) return;
      void saveDraft(values, { silent: true }).catch(() => undefined);
    }, 2500);
    return () => clearTimeout(timer);
  }, [watchedValues, coAuthors, existingPaperId, paperStatus, getValues, saveDraft]);

  const handleSaveDraft = async (values: PaperDraftFormValues) => {
    setSuccess('');
    try {
      const pid = await saveDraft(values);
      setSuccess('Черновик сохранён');
      router.replace(`/submit-paper?paperId=${pid}`);
    } catch {
      // handled in saveDraft
    }
  };

  const submitPaper = async (values: PaperDraftFormValues) => {
    setSuccess('');
    setSaving(true);
    try {
      if ((values.abstract || '').trim().length < 20) {
        setError('abstract', { message: 'Аннотация должна быть не короче 20 символов' });
        return;
      }
      const pid = await saveDraft(values);
      await runSubmit(pid, values, file, paperFileUrl || paper?.file_url);
    } catch {
      // handled in runSubmit / saveDraft
    } finally {
      setSaving(false);
    }
  };

  const canEditMeta = !paperId || paperStatus === 'draft' || paperStatus === 'revision_required';
  const canSubmit = paperStatus === 'draft' || paperStatus === 'revision_required';
  const currentStep = getSubmissionStep({
    existingPaperId,
    paper:
      paper ||
      (existingPaperId
        ? ({
            file_url: paperFileUrl,
            status: paperStatus,
            title: watchedValues.title,
            abstract: watchedValues.abstract,
          } as Paper)
        : null),
    hasNewFile: Boolean(file),
    paymentStep,
  });
  const isRevision = paperStatus === 'revision_required';

  const autosaveHint =
    autosaveState === 'saving'
      ? 'Автосохранение…'
      : autosaveState === 'saved'
        ? 'Черновик автоматически сохранён'
        : autosaveState === 'error'
          ? 'Не удалось автосохранить — сохраните вручную'
          : undefined;

  return {
    paperId,
    paymentStep,
    paperQuery,
    conference,
    control,
    register,
    handleSubmit,
    errors,
    file,
    setFile,
    existingPaperId,
    paperStatus,
    success,
    saving,
    coAuthors,
    setCoAuthors,
    canEditMeta,
    canSubmit,
    currentStep,
    isRevision,
    autosaveHint,
    handleSaveDraft,
    submitPaper,
    paper,
    paperFileUrl,
    tracks,
  };
}
