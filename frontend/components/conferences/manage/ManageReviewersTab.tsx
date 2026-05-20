'use client';

import type { Reviewer } from '@/lib/queries/conferences';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserSearchField } from '@/components/ui/UserSearchField';
import type { UseMutationResult } from '@tanstack/react-query';

type Props = {
  reviewers: Reviewer[];
  addReviewerMutation: UseMutationResult<unknown, Error, number, unknown>;
  removeReviewerMutation: UseMutationResult<unknown, Error, number, unknown>;
  onAddReviewer: (userId: number) => Promise<void>;
};

export function ManageReviewersTab({ reviewers, addReviewerMutation, removeReviewerMutation, onAddReviewer }: Props) {
  return (
    <Card className="max-w-lg space-y-4">
      <h3 className="font-semibold">Добавить в пул рецензентов</h3>
      <UserSearchField
        label="Email рецензента"
        onSelect={() => {}}
        renderAction={(u) => (
          <Button variant="secondary" disabled={addReviewerMutation.isPending} onClick={() => onAddReviewer(u.id)}>
            Добавить
          </Button>
        )}
      />
      <h3 className="font-semibold">Текущий пул</h3>
      <ul className="space-y-2">
        {reviewers.map((r) => (
          <li key={r.id} className="flex justify-between text-sm">
            <span>
              {r.full_name} — {r.email}
            </span>
            <Button variant="ghost" disabled={removeReviewerMutation.isPending} onClick={() => removeReviewerMutation.mutate(r.user_id)}>
              Удалить
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
