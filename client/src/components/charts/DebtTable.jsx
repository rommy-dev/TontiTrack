import { useState }       from 'react';
import { ArrowUpDown }    from 'lucide-react';
import { useDebtByGroup } from '../../hooks/useDashboard.js';
import Card               from '../ui/Card.jsx';
import ProgressBar        from '../ui/ProgressBar.jsx';
import Spinner            from '../ui/Spinner.jsx';
import { formatCurrency } from '../../lib/utils.js';

// ── Composant d'en-tête triable ────────────────────────────────────────────────
function SortHeader({ label, k, sortKey, sortAsc, onSort }) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
        active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      {label}
      <ArrowUpDown
        size={12}
        className={active ? 'opacity-100' : 'opacity-40'}
      />
    </button>
  );
}

export default function DebtTable() {
  const { data, isLoading } = useDebtByGroup();
  const [sortKey, setSortKey] = useState('totalRemaining');
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...(data ?? [])].sort((a, b) =>
    sortAsc
      ? (a[sortKey] ?? 0) - (b[sortKey] ?? 0)
      : (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
  );

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Card.Title>Dettes en cours par groupe</Card.Title>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {sorted.length} groupe{sorted.length > 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-primary-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Aucune dette en cours
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Toutes vos contributions sont à jour
          </p>
        </div>
      ) : (
        <>
          {/* En-têtes */}
          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-gray-50 dark:border-gray-800/50">
            <div className="col-span-4">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Groupe</span>
            </div>
            <div className="col-span-3 flex justify-end">
              <SortHeader 
                label="Restant" 
                k="totalRemaining" 
                sortKey={sortKey} 
                sortAsc={sortAsc} 
                onSort={toggleSort} 
              />
            </div>
            <div className="col-span-3 flex justify-end">
              <SortHeader 
                label="Payé" 
                k="totalPaid" 
                sortKey={sortKey} 
                sortAsc={sortAsc} 
                onSort={toggleSort} 
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <SortHeader 
                label="Ouvert" 
                k="countOpen" 
                sortKey={sortKey} 
                sortAsc={sortAsc} 
                onSort={toggleSort} 
              />
            </div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {sorted.map((row) => {
              const percent = row.totalExpected > 0
                ? Math.round((row.totalPaid / row.totalExpected) * 100)
                : 0;

              return (
                <div
                  key={row.groupId}
                  className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {row.groupName}
                    </p>
                    <div className="mt-1.5">
                      <ProgressBar
                        value={row.totalPaid}
                        max={row.totalExpected}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      {percent}% complété · {row.currency}
                    </p>
                  </div>

                  <div className="col-span-3 text-right">
                    <p className="text-sm font-semibold text-danger-600 dark:text-danger-400">
                      {formatCurrency(row.totalRemaining, row.currency)}
                    </p>
                  </div>

                  <div className="col-span-3 text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(row.totalPaid, row.currency)}
                    </p>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400 text-xs font-semibold">
                      {row.countOpen}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}