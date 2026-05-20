'use client';

import { STATUS_LABELS } from '@/lib/types';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ManagePaperFiltersProps {
  paperFilter: string;
  paperSearch: string;
  sortBy: 'submitted_desc' | 'title';
  onPaperFilterChange: (value: string) => void;
  onPaperSearchChange: (value: string) => void;
  onSortByChange: (value: 'submitted_desc' | 'title') => void;
  onExportPapers: () => void;
  onExportReviews: () => void;
  selectedCount: number;
}

export function ManagePaperFilters({
  paperFilter,
  paperSearch,
  sortBy,
  onPaperFilterChange,
  onPaperSearchChange,
  onSortByChange,
  onExportPapers,
  onExportReviews,
  selectedCount,
}: ManagePaperFiltersProps) {
  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Select label="Фильтр по статусу" value={paperFilter} onChange={(e) => onPaperFilterChange(e.target.value)}>
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="Поиск" placeholder="Название или автор" value={paperSearch} onChange={(e) => onPaperSearchChange(e.target.value)} />
        <Select label="Сортировка" value={sortBy} onChange={(e) => onSortByChange(e.target.value as 'submitted_desc' | 'title')}>
          <option value="submitted_desc">По дате подачи</option>
          <option value="title">По названию</option>
        </Select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onExportPapers}>
          Экспорт статей
        </Button>
        <Button variant="secondary" onClick={onExportReviews}>
          Экспорт рецензий
        </Button>
        {selectedCount > 0 && <span className="self-center text-sm text-slate-600">Выбрано: {selectedCount}</span>}
      </div>
    </>
  );
}
