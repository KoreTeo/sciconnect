import type { ProgramSession } from '@/lib/types';
import { formatDate, formatTimeRange } from '@/lib/format';
import {
  groupSessionsByDay,
  NO_DATE_KEY,
  sortProgramItems,
  sortedDayKeys,
} from '@/lib/site/programUtils';

function dayHeading(key: string, sampleSession?: ProgramSession): string {
  if (key === NO_DATE_KEY) return 'Без даты';
  if (sampleSession?.start_time) return formatDate(sampleSession.start_time);
  return key;
}

export function PublicProgramSchedule({ sessions }: { sessions: ProgramSession[] }) {
  if (!sessions.length) {
    return <p className="text-sm text-slate-500">Программа будет опубликована позже.</p>;
  }

  const byDay = groupSessionsByDay(sessions);
  const dayKeys = sortedDayKeys(byDay);

  return (
    <div className="space-y-10">
      {dayKeys.map((dayKey) => {
        const daySessions = byDay.get(dayKey) || [];
        return (
          <section key={dayKey}>
            <h3 className="mb-5 border-b border-slate-200 pb-2 text-2xl font-bold text-slate-900">
              {dayHeading(dayKey, daySessions[0])}
            </h3>
            <div className="space-y-6">
              {daySessions.map((session) => (
                <article
                  key={session.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-brand-700">
                        {formatTimeRange(session.start_time, session.end_time)}
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">{session.title}</h4>
                      {session.description && (
                        <p className="mt-2 text-sm text-slate-600">{session.description}</p>
                      )}
                    </div>
                    {session.room && (
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                        {session.room}
                      </span>
                    )}
                  </header>
                  {(session.items?.length ?? 0) > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[28rem] text-left text-sm">
                        <thead className="border-b bg-white text-slate-500">
                          <tr>
                            <th className="w-28 px-4 py-2.5 font-medium">Время</th>
                            <th className="px-4 py-2.5 font-medium">Доклад</th>
                            <th className="px-4 py-2.5 font-medium">Авторы</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortProgramItems(session.items || []).map((item) => (
                            <tr key={item.id} className="bg-white">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                {formatTimeRange(item.start_time, item.end_time)}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                              <td className="px-4 py-3 text-slate-600">{item.authors || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
