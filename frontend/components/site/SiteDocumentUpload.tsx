'use client';

import { useState } from 'react';
import api from '@/lib/api';

export function SiteDocumentUpload({
  conferenceId,
  onUploaded,
}: {
  conferenceId: string | string[];
  onUploaded: (data: { url: string; file_name: string }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('asset_type', 'document');
      const { data } = await api.post<{ url: string; file_name: string }>(
        `/conferences/${conferenceId}/site/assets`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onUploaded(data);
    } catch {
      setError('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept=".pdf,.zip,.doc,.docx,application/pdf,application/zip"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
      />
      {uploading && <p className="text-xs text-slate-500">Загрузка...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
