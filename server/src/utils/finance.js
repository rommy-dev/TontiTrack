/**
 * Calcule le statut d'une contribution en fonction des montants.
 * Fonction pure — pas de DB, facilement testable.
 */
export function deriveContributionStatus({ paidAmount, expectedAmount, dueDate, gracePeriodDays }) {
  if (paidAmount >= expectedAmount) return 'paid';
  if (paidAmount > 0) {
    // A-t-on dépassé la grace period ?
    const graceLimit = new Date(dueDate);
    graceLimit.setDate(graceLimit.getDate() + gracePeriodDays);
    return new Date() > graceLimit ? 'late' : 'partial';
  }
  return 'pending';
}

/**
 * Calcule le montant de pénalité à appliquer.
 * Ne modifie rien — retourne juste le montant.
 */
export function calculatePenalty({ expectedAmount, paidAmount, penaltyRate }) {
  const remaining = expectedAmount - paidAmount;
  if (remaining <= 0) return 0;
  return Math.floor(remaining * penaltyRate); // entier, en centimes
}

/**
 * Calcule le solde agrégé d'un groupe à partir des transactions.
 * Source de vérité : les Transactions, pas les Contributions.
 */
export function calculateGroupBalance(transactions) {
  const summary = transactions.reduce((acc, tx) => {
    acc.totalIn  += tx.amountCents > 0 ? tx.amountCents : 0;
    acc.totalOut += tx.amountCents < 0 ? Math.abs(tx.amountCents) : 0;
    return acc;
  }, { totalIn: 0, totalOut: 0, balance: 0 });

  summary.balance = summary.totalIn - summary.totalOut;
  return summary;
}

/**
 * Agrège les dettes de chaque membre dans un groupe.
 * Retourne { userId, paid, expected, remaining, status }[]
 */
export function buildMemberBalances(contributions) {
  return contributions.map(c => ({
    userId:    c.userId,
    expected:  c.expectedAmount,
    paid:      c.paidAmount,
    penalty:   c.penaltyAmount,
    remaining: Math.max(0, c.expectedAmount - c.paidAmount),
    status:    c.status,
  }));
}

/**
 * Formatte un montant en centimes vers une chaîne lisible.
 * Ex: 1000000 → "10 000 XAF"
 */
export function formatCurrency(amountCents, currency = 'XAF', locale = 'fr-FR') {
  const amount = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}