'use client';

import type { SiteSettings } from '@/lib/types';
import { usePublishConferenceSite, useSaveConferenceSite, useUnpublishConferenceSite } from '@/lib/queries';

export function useSiteEditorMutations(
  conferenceId: string,
  theme: SiteSettings,
  options?: {
    onMessage?: (message: string) => void;
    onPublishedChange?: (published: boolean) => void;
    onSettingsSaved?: (theme: SiteSettings) => void;
  }
) {
  const saveSiteMutation = useSaveConferenceSite(conferenceId);
  const publishSiteMutation = usePublishConferenceSite(conferenceId);
  const unpublishSiteMutation = useUnpublishConferenceSite(conferenceId);

  const saveMutation = {
    ...saveSiteMutation,
    mutate: async () => {
      await saveSiteMutation.mutateAsync(theme);
      options?.onSettingsSaved?.(theme);
      options?.onMessage?.('Настройки сохранены');
    },
    mutateAsync: async () => {
      await saveSiteMutation.mutateAsync(theme);
      options?.onSettingsSaved?.(theme);
      options?.onMessage?.('Настройки сохранены');
    },
  };

  const publishMutation = {
    ...publishSiteMutation,
    mutate: async () => {
      await publishSiteMutation.mutateAsync();
      options?.onPublishedChange?.(true);
      options?.onMessage?.('Сайт опубликован');
    },
    mutateAsync: async () => {
      await publishSiteMutation.mutateAsync();
      options?.onPublishedChange?.(true);
      options?.onMessage?.('Сайт опубликован');
    },
  };

  const unpublishMutation = {
    ...unpublishSiteMutation,
    mutate: async () => {
      await unpublishSiteMutation.mutateAsync();
      options?.onPublishedChange?.(false);
      options?.onMessage?.('Публикация снята');
    },
    mutateAsync: async () => {
      await unpublishSiteMutation.mutateAsync();
      options?.onPublishedChange?.(false);
      options?.onMessage?.('Публикация снята');
    },
  };

  return { saveMutation, publishMutation, unpublishMutation };
}
