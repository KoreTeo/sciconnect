'use client';

import { useState } from 'react';
import api, { getUploadUrl } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';

export function SiteImageUpload({
  conferenceId,
  label,
  value,
  onChange,
  assetType,
  hint,
}: {
  conferenceId: string | string[];
  label: string;
  value?: string;
  onChange: (url: string) => void;
  assetType: 'logo' | 'banner' | 'image';
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('asset_type', assetType);
      const { data } = await api.post<{ url: string }>(
        `/conferences/${conferenceId}/site/assets`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onChange(data.url);
    } catch {
      setError('Не удалось загрузить изображение');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = getUploadUrl(value);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className={
            assetType === 'logo'
              ? 'h-16 max-w-[200px] object-contain rounded border bg-white p-1'
              : 'max-h-32 w-full rounded-lg border object-cover'
          }
        />
      ) : (
        <MediaPlaceholder variant={assetType === 'logo' ? 'logo' : 'card'} className={assetType === 'logo' ? 'h-16 w-32' : 'max-h-32'} />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {value && (
        <Button type="button" variant="ghost" onClick={() => onChange('')}>
          Удалить
        </Button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {uploading && <p className="text-xs text-slate-500">Загрузка...</p>}
    </div>
  );
}
