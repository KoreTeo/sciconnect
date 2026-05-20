'use client';

import type { Conference } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { ActionRow } from '@/components/ui/ActionRow';

type ModerationDialog = { id: number; action: 'request_changes' | 'reject' } | null;

type Props = {
  queue: Conference[];
  loading: boolean;
  isMutating: boolean;
  moderationDialog: ModerationDialog;
  onModerationDialogChange: (dialog: ModerationDialog) => void;
  onApprove: (id: number) => Promise<void>;
  onModerate: (id: number, action: 'request_changes' | 'reject', comment: string) => Promise<void>;
  onError: (message: string) => void;
};

export function AdminModerationSection({
  queue,
  loading,
  isMutating,
  moderationDialog,
  onModerationDialogChange,
  onApprove,
  onModerate,
  onError,
}: Props) {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">На модерации</h2>
        <Card>
          {loading ? (
            <p className="text-sm text-slate-500">Загрузка очереди...</p>
          ) : queue.length === 0 ? (
            <EmptyState title="Очередь модерации пуста" description="Новые конференции появятся здесь после отправки организатором" />
          ) : (
            <ul className="divide-y divide-slate-200">
              {queue.map((c) => (
                <li key={c.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        ID {c.id}
                        {c.short_name ? ` · /c/${c.short_name}` : ''}
                      </p>
                      {c.moderation_comment && (
                        <p className="mt-2 text-xs text-slate-600">Комментарий организатора: {c.moderation_comment}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" disabled={isMutating} onClick={() => onApprove(c.id)}>
                        Принять
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isMutating}
                        onClick={() => onModerationDialogChange({ id: c.id, action: 'request_changes' })}
                      >
                        На доработку
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isMutating}
                        onClick={() => onModerationDialogChange({ id: c.id, action: 'reject' })}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Modal
        open={!!moderationDialog}
        onClose={() => onModerationDialogChange(null)}
        title={moderationDialog?.action === 'request_changes' ? 'Причина возврата на доработку' : 'Причина отклонения'}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!moderationDialog) return;
            const form = new FormData(event.currentTarget);
            const comment = String(form.get('comment') || '').trim();
            if (!comment) {
              onError('Укажите комментарий для модерации');
              return;
            }
            await onModerate(moderationDialog.id, moderationDialog.action, comment);
            onModerationDialogChange(null);
          }}
        >
          <Textarea
            name="comment"
            label="Комментарий модератора"
            rows={4}
            required
            hint="Автор конференции увидит этот комментарий."
          />
          <ActionRow align="end">
            <Button type="button" variant="ghost" onClick={() => onModerationDialogChange(null)}>
              Отмена
            </Button>
            <Button type="submit" variant={moderationDialog?.action === 'reject' ? 'danger' : 'secondary'}>
              Отправить
            </Button>
          </ActionRow>
        </form>
      </Modal>
    </>
  );
}
