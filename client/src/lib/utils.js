import { clsx }        from 'clsx';
import { twMerge }     from 'tailwind-merge';

// cn() fusionne intelligemment les classes Tailwind
// Ex : cn('px-4 px-6') → 'px-6' (pas de duplication)
// Ex : cn('text-red-500', isError && 'text-red-700') → résout conditionnellement
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formate un montant en centimes vers une chaîne lisible
export function formatCurrency(amountCents, currency = 'XAF', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

// Formate une date
export function formatDate(dateString, locale = 'fr-FR') {
  return new Intl.DateTimeFormat(locale, {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(dateString));
}

// Calcule le pourcentage de progression d'une contribution
export function progressPercent(paid, expected) {
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((paid / expected) * 100));
}

// Retourne le badge à afficher selon le statut d'une contribution
export function contributionStatusConfig(status) {
  const map = {
    paid:      { label: 'Payé',     className: 'badge-success' },
    partial:   { label: 'Partiel',  className: 'badge-warning' },
    pending:   { label: 'En attente', className: 'badge-neutral' },
    late:      { label: 'Retard',   className: 'badge-danger'  },
    defaulted: { label: 'Impayé',   className: 'badge-danger'  },
  };
  return map[status] ?? { label: status, className: 'badge-neutral' };
}

// Retourne la config visuelle d'un statut de cycle
export function cycleStatusConfig(status) {
  const map = {
    pending:   { label: 'En attente', className: 'badge-neutral' },
    active:    { label: 'En cours',   className: 'badge-primary' },
    completed: { label: 'Terminé',    className: 'badge-success' },
    failed:    { label: 'Échoué',     className: 'badge-danger'  },
  };
  return map[status] ?? { label: status, className: 'badge-neutral' };
}