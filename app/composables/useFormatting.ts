import {
  DATE_FORMATS,
  DURATION_FORMATS,
  formatDateTime,
  formatDuration,
  TIME_FORMATS,
  type DateFormat,
  type DurationFormat,
  type TimeFormat,
} from '~/utils/display-formatting';

export function useFormatting() {
  const { locale } = useI18n();
  const dateFormat = useState<DateFormat>('date-format', () => 'DD.MM.YYYY');
  const timeFormat = useState<TimeFormat>('time-format', () => 'HH:mm');
  const durationFormat = useState<DurationFormat>('duration-format', () => 'human');
  const formattingHydrated = useState('formatting-hydrated', () => false);

  onMounted(() => {
    if (formattingHydrated.value) return;
    const storedDateFormat = localStorage.getItem('print-cost-date-format');
    if (DATE_FORMATS.includes(storedDateFormat as DateFormat))
      dateFormat.value = storedDateFormat as DateFormat;
    else if (storedDateFormat === 'iso') dateFormat.value = 'YYYY-MM-DD';
    else if (storedDateFormat === 'locale')
      dateFormat.value = locale.value === 'en-US' ? 'MM/DD/YYYY' : 'DD.MM.YYYY';

    const storedTimeFormat = localStorage.getItem('print-cost-time-format');
    if (TIME_FORMATS.includes(storedTimeFormat as TimeFormat))
      timeFormat.value = storedTimeFormat as TimeFormat;

    const storedDurationFormat = localStorage.getItem('print-cost-duration-format');
    if (DURATION_FORMATS.includes(storedDurationFormat as DurationFormat))
      durationFormat.value = storedDurationFormat as DurationFormat;
    formattingHydrated.value = true;
  });

  function money(value: unknown, currency = 'EUR') {
    const numeric = Number(String(value ?? 0));
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency }).format(numeric);
  }

  function decimal(value: unknown, maximumFractionDigits = 6) {
    return new Intl.NumberFormat(locale.value, { maximumFractionDigits }).format(Number(String(value ?? 0)));
  }

  function dateTime(value: string | number | Date) {
    return formatDateTime(value, dateFormat.value, timeFormat.value, locale.value);
  }

  function duration(seconds: number) {
    return formatDuration(seconds, durationFormat.value, locale.value);
  }

  function setDateFormat(value: DateFormat) {
    dateFormat.value = value;
    if (import.meta.client) localStorage.setItem('print-cost-date-format', value);
  }

  function setTimeFormat(value: TimeFormat) {
    timeFormat.value = value;
    if (import.meta.client) localStorage.setItem('print-cost-time-format', value);
  }

  function setDurationFormat(value: DurationFormat) {
    durationFormat.value = value;
    if (import.meta.client) localStorage.setItem('print-cost-duration-format', value);
  }

  return {
    money,
    decimal,
    dateTime,
    duration,
    dateFormat,
    timeFormat,
    durationFormat,
    setDateFormat,
    setTimeFormat,
    setDurationFormat,
  };
}
