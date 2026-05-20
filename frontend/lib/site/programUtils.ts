import type { ProgramItem, ProgramSession } from '@/lib/types';

export const NO_DATE_KEY = 'no-date';

export function sessionDayKey(session: ProgramSession): string {
  if (!session.start_time) return NO_DATE_KEY;
  const d = new Date(session.start_time);
  if (isNaN(d.getTime())) return NO_DATE_KEY;
  return d.toISOString().slice(0, 10);
}

export function sortProgramItems(items: ProgramItem[]): ProgramItem[] {
  return [...items].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const ta = a.start_time ? new Date(a.start_time).getTime() : 0;
    const tb = b.start_time ? new Date(b.start_time).getTime() : 0;
    return ta - tb;
  });
}

export function groupSessionsByDay(sessions: ProgramSession[]): Map<string, ProgramSession[]> {
  const map = new Map<string, ProgramSession[]>();
  for (const session of sessions) {
    const key = sessionDayKey(session);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(session);
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      const ta = a.start_time ? new Date(a.start_time).getTime() : 0;
      const tb = b.start_time ? new Date(b.start_time).getTime() : 0;
      return ta - tb;
    });
  }
  return map;
}

export function sortedDayKeys(map: Map<string, ProgramSession[]>): string[] {
  return [...map.keys()].sort((a, b) => {
    if (a === NO_DATE_KEY) return 1;
    if (b === NO_DATE_KEY) return -1;
    return a.localeCompare(b);
  });
}
