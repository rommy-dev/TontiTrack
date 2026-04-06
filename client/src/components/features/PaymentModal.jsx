// src/components/contributions/PaymentModal.jsx
import { useState }           from 'react';
import { AlertCircle }        from 'lucide-react';
import { usePayContribution } from '../../hooks/useContributions.js';
import Button   from '../ui/Button.jsx';
import Input    from '../ui/Input.jsx';
import { formatCurrency, progressPercent } from '../../lib/utils.js';

export default function PaymentModal({ contribution: c, onClose }) {
  const remaining = (c.expectedAmount - c.paidAmount) / 100; // en unités pour l'input
  const currency  = c.groupId?.settings?.currency ?? 'XAF';
  const allowPartial = c.groupId?.settings?.allowPartialPay ?? true;

  const [amount, setAmount] = useState(remaining.toString());
  const [error,  setError]  = useState('');

  const { mutate: pay, isPending } = usePayContribution(c._id);

  function validate() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Montant invalide'); return false;
    }
    if (val > remaining) {
      setError(`Maximum : ${formatCurrency(c.expectedAmount - c.paidAmount, currency)}`);
      return false;
    }
    if (!allowPartial && val < remaining) {
      setError('Ce groupe n\'accepte pas les paiements partiels');
      return false;
    }
    setError('');
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    pay(parseFloat(amount), { onSuccess: onClose });
  }

  const isLate = c.status === 'late';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-md animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Enregistrer un paiement
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {c.groupId?.name} · Cycle #{c.cycleId?.cycleNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Récap montants */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Attendu',  value: formatCurrency(c.expectedAmount, currency) },
              { label: 'Déjà payé', value: formatCurrency(c.paidAmount, currency) },
              { label: 'Restant',  value: formatCurrency(c.expectedAmount - c.paidAmount, currency), highlight: true },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={`rounded-xl p-3 text-center ${
                  highlight
                    ? 'bg-primary-50 dark:bg-primary-500/10'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                <p className={`text-sm font-bold ${
                  highlight
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Barre de progression */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
              <span>Progression actuelle</span>
              <span>{progressPercent(c.paidAmount, c.expectedAmount)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPercent(c.paidAmount, c.expectedAmount)}%` }}
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Alerte retard */}
          {isLate && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20">
              <AlertCircle size={15} className="text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger-600 dark:text-danger-400 leading-relaxed">
                Ce paiement est en retard. Une pénalité de{' '}
                <strong>{(c.groupId?.settings?.penaltyRate ?? 0.05) * 100}%</strong>{' '}
                du montant restant s'applique automatiquement.
              </p>
            </div>
          )}

          {/* Input montant */}
          <Input
            label={`Montant à payer (${currency})`}
            type="number"
            required
            min="1"
            max={remaining}
            step="1"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            error={error}
            hint={allowPartial
              ? `Paiement partiel autorisé — max ${formatCurrency(c.expectedAmount - c.paidAmount, currency)}`
              : `Paiement intégral requis — ${formatCurrency(c.expectedAmount - c.paidAmount, currency)}`}
          />

          {/* Raccourcis */}
          {allowPartial && (
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => {
                const val = Math.floor((remaining * pct) / 100);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setAmount(val.toString()); setError(''); }}
                    className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={isPending}
              variant={isLate ? 'danger' : 'primary'}
            >
              Confirmer le paiement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}