import {
  deriveContributionStatus,
  calculatePenalty,
  formatCurrency,
} from '../../src/utils/finance.js';

describe('deriveContributionStatus', () => {
  const dueDate        = new Date(Date.now() - 86400000); // hier
  const gracePeriodDays = 3;

  it('retourne "paid" si paidAmount >= expectedAmount', () => {
    expect(deriveContributionStatus({
      paidAmount: 5000, expectedAmount: 5000, dueDate, gracePeriodDays
    })).toBe('paid');
  });

  it('retourne "partial" si paiement partiel dans la grace period', () => {
    const futureDue = new Date(Date.now() + 86400000 * 5); // dans 5 jours
    expect(deriveContributionStatus({
      paidAmount: 3000, expectedAmount: 5000, dueDate: futureDue, gracePeriodDays
    })).toBe('partial');
  });

  it('retourne "late" si paiement partiel après la grace period', () => {
    const pastDue = new Date(Date.now() - 86400000 * 5); // il y a 5 jours
    expect(deriveContributionStatus({
      paidAmount: 3000, expectedAmount: 5000, dueDate: pastDue, gracePeriodDays
    })).toBe('late');
  });

  it('retourne "pending" si aucun paiement', () => {
    expect(deriveContributionStatus({
      paidAmount: 0, expectedAmount: 5000, dueDate, gracePeriodDays
    })).toBe('pending');
  });
});

describe('calculatePenalty', () => {
  it('calcule 5% du montant restant', () => {
    expect(calculatePenalty({ expectedAmount: 10000, paidAmount: 6000, penaltyRate: 0.05 }))
      .toBe(200); // 5% de 4000 = 200
  });

  it('retourne 0 si déjà payé', () => {
    expect(calculatePenalty({ expectedAmount: 5000, paidAmount: 5000, penaltyRate: 0.05 }))
      .toBe(0);
  });

  it('retourne un entier (centimes)', () => {
    const result = calculatePenalty({ expectedAmount: 10000, paidAmount: 6001, penaltyRate: 0.05 });
    expect(Number.isInteger(result)).toBe(true); // Math.floor garantit l'entier
  });
});
