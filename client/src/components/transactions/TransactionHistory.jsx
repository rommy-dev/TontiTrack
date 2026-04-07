import { useState }          from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyTransactions } from '../../hooks/useTransactions.js';
import Card    from '../ui/Card.jsx';
import Spinner from '../ui/Spinner.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';

const TYPE_CONFIG = {
  contribution: {
    label:  'Contribution',
    icon:   ArrowUpRight,
    color:  'text-success-500',
    bg:     'bg-success-50 dark:bg-success-500/10',
    sign:   '+',
  },
  penalty: {
    label:  'Pénalité',
    icon:   AlertCircle,
    color:  'text-danger-500',
    bg:     'bg-danger-50 dark:bg-danger-500/10',
    sign:   '-',
  },
  payout: {
    label:  'Versement reçu',
    icon:   ArrowDownLeft,
    color:  'text-primary-500',
    bg:     'bg-primary-50 dark:bg-primary-500/10',
    sign:   '+',
  },
  refund: {
    label:  'Remboursement',
    icon:   RotateCcw,
    color:  'text-warning-500',
    bg:     'bg-warning-50 dark:bg-warning-500/10',
    sign:   '±',
  },
};

const TYPE_FILTERS = [
  { value: '',             label: 'Tout' },
  { value: 'contribution', label: 'Contributions' },
  { value: 'penalty',      label: 'Pénalités' },
  { value: 'payout',       label: 'Versements' },
  { value: 'refund',       label: 'Remboursements' },
];

export default function TransactionHistory({ groupId, title = 'Historique des transactions' }) {
  const [page,   setPage]   = useState(1);
  const [type,   setType]   = useState('');

  // useMyTransactions si pas de groupId, sinon filtrer par groupe
  const { data, isLoading } = useMyTransactions({
    page,
    limit: 10,
    type:    type || undefined,
    groupId: groupId || undefined,
  });

  const transactions = data?.transactions ?? [];
  const pagination   = data?.pagination;

  return (
    <Card padding="none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Card.Title>{title}</Card.Title>
        {/* Filtre type */}
        <div className="flex gap-1">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setType(value); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                type === value
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-primary-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucune transaction</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {transactions.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.contribution;
            const Icon = cfg.icon;
            const isNeg = tx.amountCents < 0;

            return (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* Icône */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={15} className={cfg.color} />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {cfg.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {tx.groupId?.name ?? '—'}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </p>
                </div>

                {/* Montant + date */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${
                    isNeg
                      ? 'text-danger-600 dark:text-danger-400'
                      : tx.type === 'payout'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-800 dark:text-gray-100'
                  }`}>
                    {isNeg ? '−' : cfg.sign === '+' ? '+' : ''}{formatCurrency(Math.abs(tx.amountCents), tx.currency)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {pagination.total} transaction{pagination.total > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-center">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}