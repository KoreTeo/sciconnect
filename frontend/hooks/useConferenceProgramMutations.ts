'use client';

import { useSaveConferenceProgram } from '@/lib/queries';
import { toProgramPayload, type ProgramFormValues } from '@/lib/validation';

export function useConferenceProgramMutations(conferenceId: string) {
  const saveProgramMutation = useSaveConferenceProgram(conferenceId);

  return {
    ...saveProgramMutation,
    mutateAsync: (values: ProgramFormValues) => saveProgramMutation.mutateAsync(toProgramPayload(values)),
    mutate: (values: ProgramFormValues) => {
      saveProgramMutation.mutate(toProgramPayload(values));
    },
  };
}
