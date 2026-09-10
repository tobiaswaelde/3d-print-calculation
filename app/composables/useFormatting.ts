export function useFormatting() {
  const { locale } = useI18n();
  const dateFormat = useState<'locale' | 'iso'>('date-format', () => {
    if (import.meta.client && localStorage.getItem('print-cost-date-format') === 'iso') return 'iso';
    return 'locale';
  });

  function money(value: unknown, currency = 'EUR') {
    const numeric = Number(String(value ?? 0));
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency }).format(numeric);
  }

  function decimal(value: unknown, maximumFractionDigits = 6) {
    return new Intl.NumberFormat(locale.value, { maximumFractionDigits }).format(Number(String(value ?? 0)));
  }

  function dateTime(value: string | number | Date) {
    const parsed = new Date(value);
    if (dateFormat.value === 'iso') {
      const date = [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()]
        .map((part, index) => String(part).padStart(index ? 2 : 4, '0'))
        .join('-');
      const time = [parsed.getHours(), parsed.getMinutes()]
        .map((part) => String(part).padStart(2, '0'))
        .join(':');
      return `${date} ${time}`;
    }
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  }

  function setDateFormat(value: 'locale' | 'iso') {
    dateFormat.value = value;
    if (import.meta.client) localStorage.setItem('print-cost-date-format', value);
  }

  return { money, decimal, dateTime, dateFormat, setDateFormat };
}
