'use client';

import { useState } from 'react';
import type { ConferenceTrack } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateConferenceTrack, useConferenceTracks } from '@/lib/queries';

type Props = {
  conferenceId: string;
};

export function ManageTracksTab({ conferenceId }: Props) {
  const tracksQuery = useConferenceTracks(conferenceId);
  const createTrack = useCreateConferenceTrack(conferenceId);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    await createTrack.mutateAsync({ name: name.trim(), slug: slug.trim().toLowerCase() });
    setName('');
    setSlug('');
  };

  const tracks = tracksQuery.data || [];

  return (
    <Card>
      <h3 className="mb-4 font-semibold">Треки конференции</h3>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Input label="Название" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Slug" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ml-nlp" />
        <div className="flex items-end">
          <Button type="button" onClick={handleCreate} disabled={createTrack.isPending}>
            {createTrack.isPending ? 'Создание...' : 'Добавить трек'}
          </Button>
        </div>
      </div>
      {tracks.length === 0 ? (
        <p className="text-sm text-slate-500">Треки не созданы — авторы не выбирают секцию при подаче.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {tracks.map((track: ConferenceTrack) => (
            <li key={track.id} className="flex justify-between border-b py-2">
              <span>{track.name}</span>
              <span className="text-slate-500">{track.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
