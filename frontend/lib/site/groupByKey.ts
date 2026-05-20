export const NO_YEAR_KEY = 'no-year';

export function groupItemsByYear<T>(items: T[], getYear: (item: T) => number | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const year = getYear(item);
    const key = year != null ? String(year) : NO_YEAR_KEY;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function sortedYearKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === NO_YEAR_KEY) return 1;
    if (b === NO_YEAR_KEY) return -1;
    return Number(b) - Number(a);
  });
}

export function yearGroupLabel(key: string): string {
  return key === NO_YEAR_KEY ? 'Без даты' : key;
}
