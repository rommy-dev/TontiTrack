import { useState }        from 'react';
import { CreditCard, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyContributions }  from '../../hooks/useContributions.js';
import Card               from '../../components/ui/Card.jsx';
import Badge              from '../../components/ui/Badge.jsx';
import { ContributionBadge } from '../../components/ui/Badge.jsx';
import Button             from '../../components/ui/Button.jsx';
import Spinner            from '../../components/ui/Spinner.jsx';
import EmptyState         from '../../components/ui/EmptyState.jsx';
import ProgressBar        from '../../components/ui/ProgressBar.jsx';
import PaymentModal       from '../../components/features/PaymentModal.jsx';
import { SkeletonContributionCard } from '../../components/ui/Skeleton.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';

const STATUS_FILTERS = [
  { value: '',          label: 'Tous'        },
  { value: 'pending',   label: 'En attente'  },
  { value: 'partial',   label: 'Partiel'     },
  { value: 'paid',      label: 'Payé'        },
  { value: 'late',      label: 'En retard'   },
  { value: 'defaulted', label: 'Impayé'      },
];

export default function ContributionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [paying,       setPaying]       = useState(null); // contribution à payer

  const { data, isLoading } = useMyContributions({
    status: statusFilter || undefined,
    page,
    limit: 12,
  });

  const contributions = data?.contributions ?? [];
  const pagination    = data?.pagination;

  return (
    <div className="space-y-5">

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonContributionCard key={i} />
          ))}
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={28} />}
          title="Aucune contribution"
          description={statusFilter
            ? 'Aucune contribution avec ce statut.'
            : 'Vos contributions apparaîtront ici dès que vous rejoindrez un groupe actif.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contributions.map((c) => (
              <ContributionCard
                key={c._id}
                contribution={c}
                onPay={() => setPaying(c)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {pagination.total} contribution{pagination.total > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  leftIcon={<ChevronLeft size={14} />}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400 px-1">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight size={14} />}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de paiement */}
      {paying && (
        <PaymentModal
          contribution={paying}
          onClose={() => setPaying(null)}
        />
      )}
    </div>
  );
}

// ── Carte contribution ────────────────────────────────────────────────────────
function ContributionCard({ contribution: c, onPay }) {
  const canPay = ['pending', 'partial', 'late'].includes(c.status);
  const remaining = c.expectedAmount - c.paidAmount;
  const currency  = c.groupId?.settings?.currency ?? 'XAF';

  return (
    <Card className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {c.groupId?.name ?? '—'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Cycle #{c.cycleId?.cycleNumber ?? '?'} · Échéance {c.cycleId?.dueDate
              ? formatDate(c.cycleId.dueDate)
              : '—'}
          </p>
        </div>
        <ContributionBadge status={c.status} />
      </div>

      {/* Montants */}
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-gray-400 dark:text-gray-500 text-xs">Payé</span>
        <span className="font-bold text-gray-800 dark:text-gray-100">
          {formatCurrency(c.paidAmount, currency)}
          <span className="font-normal text-gray-400 dark:text-gray-500">
            {' '}/ {formatCurrency(c.expectedAmount, currency)}
          </span>
        </span>
      </div>

      <ProgressBar
        value={c.paidAmount}
        max={c.expectedAmount}
        showLabel={false}
        size="sm"
      />

      {/* Pénalité */}
      {c.penaltyAmount > 0 && (
        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-danger-50 dark:bg-danger-500/10">
          <span className="text-danger-600 dark:text-danger-400">Pénalité appliquée</span>
          <span className="font-semibold text-danger-600 dark:text-danger-400">
            + {formatCurrency(c.penaltyAmount, currency)}
          </span>
        </div>
      )}

      {/* Action */}
      {canPay && (
        <Button
          size="sm"
          fullWidth
          variant={c.status === 'late' ? 'danger' : 'primary'}
          onClick={onPay}
        >
          Payer {formatCurrency(remaining, currency)}
        </Button>
      )}
    </Card>
  );
}