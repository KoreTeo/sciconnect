'use client';

import type { NotificationPreferences } from '@/lib/types';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';

const CATEGORIES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'papers', label: 'Статьи' },
  { key: 'reviews', label: 'Рецензии' },
  { key: 'conferences', label: 'Конференции' },
];

export function NotificationPreferencesTable() {
  const toast = useToast();
  const prefsQuery = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const togglePref = async (
    category: keyof NotificationPreferences,
    channel: 'email' | 'in_app',
    value: boolean
  ) => {
    const current = prefsQuery.data;
    if (!current) return;
    try {
      await updatePrefs.mutateAsync({
        [category]: { ...current[category], [channel]: value },
      });
      toast.success('Настройки уведомлений сохранены');
    } catch {
      toast.error('Не удалось сохранить настройки');
    }
  };

  return (
    <Card className="mt-6">
      <h2 className="mb-4 font-semibold">Уведомления</h2>
      <p className="mb-4 text-sm text-slate-600">
        Управляйте каналами для событий по статьям, рецензиям и конференциям. Письма подтверждения и сброса пароля
        всегда отправляются.
      </p>
      {prefsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Загрузка...</p>
      ) : prefsQuery.data ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Категория</th>
                <th className="py-2 px-4">В приложении</th>
                <th className="py-2 pl-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(({ key, label }) => (
                <tr key={key} className="border-b">
                  <td className="py-3 pr-4 font-medium">{label}</td>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={prefsQuery.data[key].in_app}
                      disabled={updatePrefs.isPending}
                      onChange={(e) => togglePref(key, 'in_app', e.target.checked)}
                      aria-label={`${label}: в приложении`}
                    />
                  </td>
                  <td className="py-3 pl-4">
                    <input
                      type="checkbox"
                      checked={prefsQuery.data[key].email}
                      disabled={updatePrefs.isPending}
                      onChange={(e) => togglePref(key, 'email', e.target.checked)}
                      aria-label={`${label}: email`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
