const RATES_TO_XAF = {
  XAF: 1,
  XOF: 1,
  EUR: 655.957,
  USD: 610,
  GBP: 780,
  CHF: 680,
  CAD: 450,
  MAD: 61,
  NGN: 0.4,
  GHS: 41,
};

export const SUPPORTED_CURRENCIES = Object.keys(RATES_TO_XAF);

export function convertCents(amountCents = 0, fromCurrency = 'XAF', toCurrency = 'XAF') {
  if (fromCurrency === toCurrency) return Math.round(amountCents);

  const rateFrom = RATES_TO_XAF[fromCurrency];
  const rateTo = RATES_TO_XAF[toCurrency];

  if (!rateFrom || !rateTo) {
    return Math.round(amountCents);
  }

  const amountInXaf = amountCents * rateFrom;
  return Math.round(amountInXaf / rateTo);
}

export function formatCents(amountCents = 0, currency = 'XAF', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function getRate(fromCurrency = 'XAF', toCurrency = 'XAF') {
  const rateFrom = RATES_TO_XAF[fromCurrency];
  const rateTo = RATES_TO_XAF[toCurrency];
  if (!rateFrom || !rateTo) return null;
  return rateFrom / rateTo;
}

export function convertAndFormat(
  amountCents  = 0,
  fromCurrency = 'XAF',
  toCurrency   = 'XAF',
  locale       = 'fr-FR'
) {
  const converted = convertCents(amountCents, fromCurrency, toCurrency);
  return formatCents(converted, toCurrency, locale);
}