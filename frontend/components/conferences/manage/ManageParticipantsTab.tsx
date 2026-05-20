'use client';

import { REGISTRATION_TYPE_LABELS, REGISTRATION_STATUS_LABELS, type Registration } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Props = {
  registrations: Registration[];
  onExport: () => void;
};

export function ManageParticipantsTab({ registrations, onExport }: Props) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Зарегистрированные участники</h3>
        <Button type="button" variant="secondary" onClick={onExport}>
          Экспорт CSV
        </Button>
      </div>
      {registrations.length === 0 ? (
        <p className="text-slate-500">Пока нет регистраций</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {registrations.map((r) => (
            <li key={r.id} className="flex justify-between border-b py-2">
              <span>
                {r.user_name} ({r.user_email})
                {r.user_country ? ` · ${r.user_country}` : ''}
              </span>
              <span className="text-slate-500">
                {REGISTRATION_TYPE_LABELS[r.registration_type] || r.registration_type}
                {' · '}
                {REGISTRATION_STATUS_LABELS[r.status] || r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
