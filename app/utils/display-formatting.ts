import dayjs from 'dayjs';
import durationPlugin from 'dayjs/plugin/duration';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

dayjs.extend(durationPlugin);

export const DATE_FORMATS = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'D MMM YYYY'] as const;
export const TIME_FORMATS = ['HH:mm', 'hh:mm A', 'HH:mm:ss'] as const;
export const DURATION_FORMATS = ['human', 'compact', 'clock', 'decimal'] as const;

export type DateFormat = (typeof DATE_FORMATS)[number];
export type TimeFormat = (typeof TIME_FORMATS)[number];
export type DurationFormat = (typeof DURATION_FORMATS)[number];

type DisplayLocale = 'de-DE' | 'en-US';
type DurationUnit = 'hour' | 'minute' | 'second';

const durationUnits: Record<DisplayLocale, Record<DurationUnit, [string, string]>> = {
  'de-DE': {
    hour: ['Stunde', 'Stunden'],
    minute: ['Minute', 'Minuten'],
    second: ['Sekunde', 'Sekunden'],
  },
  'en-US': {
    hour: ['hour', 'hours'],
    minute: ['minute', 'minutes'],
    second: ['second', 'seconds'],
  },
};

function dayjsLocale(locale: string) {
  return locale === 'de-DE' ? 'de' : 'en';
}

function displayLocale(locale: string): DisplayLocale {
  return locale === 'de-DE' ? 'de-DE' : 'en-US';
}

export function formatDateTime(
  value: string | number | Date,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
  locale: string,
) {
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '—';
  return parsed.locale(dayjsLocale(locale)).format(`${dateFormat} ${timeFormat}`);
}

export function formatDuration(seconds: number, format: DurationFormat, locale: string) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const value = dayjs.duration(safeSeconds, 'seconds');
  const hours = Math.floor(value.asHours());
  const minutes = value.minutes();
  const remainingSeconds = value.seconds();

  if (format === 'clock') {
    return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':');
  }
  if (format === 'decimal') {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value.asHours())} h`;
  }

  const values: Array<[number, DurationUnit]> = [
    [hours, 'hour'],
    [minutes, 'minute'],
    [remainingSeconds, 'second'],
  ];
  const visibleValues = values.filter(([part]) => part > 0);
  if (!visibleValues.length) visibleValues.push([0, 'minute']);

  if (format === 'compact') {
    const suffixes: Record<DurationUnit, string> = { hour: 'h', minute: 'm', second: 's' };
    return visibleValues.map(([part, unit]) => `${part}${suffixes[unit]}`).join(' ');
  }

  const units = durationUnits[displayLocale(locale)];
  return visibleValues.map(([part, unit]) => `${part} ${units[unit][part === 1 ? 0 : 1]}`).join(' ');
}
