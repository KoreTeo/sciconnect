'use client';

import { Input } from '@/components/ui/Input';

interface PaperFileUploadProps {
  onChange: (file: File | null) => void;
  hasExistingFile?: boolean;
}

export function PaperFileUpload({ onChange, hasExistingFile }: PaperFileUploadProps) {
  return (
    <>
      <Input label="PDF файл" type="file" accept=".pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {hasExistingFile && (
        <p className="text-xs text-green-700">PDF уже загружен. Выберите новый файл, чтобы заменить.</p>
      )}
      <p className="text-xs text-slate-500">Для подачи нужен PDF и аннотация не короче 20 символов.</p>
    </>
  );
}
