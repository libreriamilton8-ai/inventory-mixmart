import type { DateRange } from 'react-day-picker';

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const PRESETS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
] as const;

export type PresetKey = (typeof PRESETS)[number]['key'];

export const shortFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
});

export const longFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function parseISO(value: string) {
  if (!value || !ISO_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function normalizeRange(fromValue: string, toValue: string) {
  const fromDate = parseISO(fromValue);
  const toDate = parseISO(toValue);

  if (!fromDate && !toDate) return undefined;

  if (fromDate && toDate) {
    return fromDate <= toDate
      ? { from: fromDate, to: toDate }
      : { from: toDate, to: fromDate };
  }

  const singleDay = fromDate ?? toDate;
  return singleDay ? { from: singleDay, to: singleDay } : undefined;
}

export function rangeToValues(range: DateRange | undefined) {
  if (!range?.from && !range?.to) {
    return { from: '', to: '' };
  }

  const from = range?.from ?? range?.to;
  const to = range?.to ?? range?.from;

  if (!from || !to) {
    return { from: '', to: '' };
  }

  return { from: toISO(from), to: toISO(to) };
}

export function formatRangeLabel(
  range: DateRange | undefined,
  fallback: string,
) {
  if (!range?.from && !range?.to) return fallback;

  const from = range?.from ?? range?.to;
  const to = range?.to ?? range?.from;

  if (!from || !to) return fallback;
  if (toISO(from) === toISO(to)) return longFormatter.format(from);

  return `${shortFormatter.format(from)} - ${longFormatter.format(to)}`;
}

export function presetRange(key: PresetKey) {
  const today = startOfDay(new Date());

  if (key === 'today') {
    return { from: today, to: today };
  }

  if (key === 'week') {
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const from = new Date(today);
    from.setDate(today.getDate() + diff);
    return { from, to: today };
  }

  return { from: startOfMonth(today), to: today };
}

export function resolvePreset(range: DateRange | undefined) {
  const values = rangeToValues(range);

  return (
    PRESETS.find((preset) => {
      const current = presetRange(preset.key);
      return (
        values.from === toISO(current.from) && values.to === toISO(current.to)
      );
    })?.key ?? null
  );
}
