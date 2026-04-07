// src/pages/dashboard/DashboardPage.jsx
import { Link }               from 'react-router-dom';
import { Users, CreditCard, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { useDashboardKpis }   from '../../hooks/useDashboard.js';
import { useAuthStore }       from '../../store/authStore.js';
import MonthlyChart           from '../../components/charts/MonthlyChart.jsx';
import StatusDonut            from '../../components/charts/StatusDonut.jsx';
import DebtTable              from '../../components/charts/DebtTable.jsx';
import TransactionHistory     from '../../components/transactions/TransactionHistory.jsx';
import Spinner                from '../../components/ui/Spinner.jsx';
import { formatCurrency }     from '../../lib/utils.js';

// ── Carte KPI ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, to }) {
  const palette = {
    primary: {
      icon: 'bg-primary-50 dark:bg-primary-500/10 text-primary-500',
      val:  'text-gray-900 dark:text-gray-100',
    },
    success: {
      icon: 'bg-success-50 dark:bg-success-500/10 text-success-500',
      val:  'text-gray-900 dark:text-gray-100',
    },
    warning: {
      icon: 'bg-warning-50 dark:bg-warning-500/10 text-warning-500',
      val:  'text-gray-900 dark:text-gray-100',
    },
    danger: {
      icon: 'bg-danger-50 dark:bg-danger-500/10 text-danger-500',
      val:  'text-danger-600 dark:text-danger-400',
    },
  };
  const p = palette[color] ?? palette.primary;

  const inner = (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl shadow-card p-5 flex items-center gap-4 transition-all duration-150 hover:shadow-card-hover group">
      <div className={`p-3 rounded-xl flex-shrink-0 ${p.icon}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">{label}</p>
        <p className={`text-xl font-bold mt-0.5 truncate ${p.val}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{sub}</p>}
      </div>
      {to && (
        <ArrowRight
          size={14}
          className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0"
        />
      )}
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user            = useAuthStore((s) => s.user);
  const { data: kpis, isLoading } = useDashboardKpis();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    );
  }

  const c = kpis?.contributions;
  const g = kpis?.groups;

  return (
    <div className="space-y-6">

      {/* Salutation */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour, {user?.firstName} 👋
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Groupes actifs"
          value={g?.active ?? '—'}
          sub={`${g?.total ?? 0} au total`}
          color="primary"
          to="/groups"
        />
        <KpiCard
          icon={CreditCard}
          label="Payé ce mois"
          value={c ? formatCurrency(kpis.thisMonth.totalPaid) : '—'}
          sub={`${c?.countPaid ?? 0} contribution${(c?.countPaid ?? 0) > 1 ? 's' : ''} soldées`}
          color="success"
          to="/contributions"
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux de complétion"
          value={c ? `${c.completionRate}%` : '—'}
          sub={`${c?.countPaid ?? 0} payées sur ${(c?.countPaid ?? 0) + (c?.countPending ?? 0) + (c?.countPartial ?? 0) + (c?.countLate ?? 0)}`}
          color="warning"
        />
        <KpiCard
          icon={AlertTriangle}
          label="En retard"
          value={c ? (c.countLate > 0 ? c.countLate : '0') : '—'}
          sub={c?.countLate > 0
            ? `${formatCurrency(c.totalRemaining)} restant`
            : 'Tout est à jour'}
          color={c?.countLate > 0 ? 'danger' : 'success'}
          to={c?.countLate > 0 ? '/contributions' : undefined}
        />
      </div>

      {/* Alerte retards */}
      {c?.countLate > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20">
          <AlertTriangle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-400">
              {c.countLate} contribution{c.countLate > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs text-danger-600/70 dark:text-danger-400/70 mt-0.5">
              Des pénalités s'accumulent. Régularisez dès que possible.
            </p>
          </div>
          <Link
            to="/contributions"
            className="text-xs font-semibold text-danger-600 dark:text-danger-400 hover:underline flex-shrink-0"
          >
            Voir →
          </Link>
        </div>
      )}

      {/* Graphiques — 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyChart />
        </div>
        <div className="lg:col-span-1">
          <StatusDonut />
        </div>
      </div>

      {/* Tableau dettes + historique — 2 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DebtTable />
        <TransactionHistory title="Transactions récentes" />
      </div>

    </div>
  );
}