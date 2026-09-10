export function useFormatting() {
  const { locale } = useI18n();

  function money(value: unknown, currency = 'EUR') {
    const numeric = Number(String(value ?? 0));
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency }).format(numeric);
  }

  function decimal(value: unknown, maximumFractionDigits = 6) {
    return new Intl.NumberFormat(locale.value, { maximumFractionDigits }).format(Number(String(value ?? 0)));
  }

  return { money, decimal };
}
