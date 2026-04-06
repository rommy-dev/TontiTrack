import { Users, CreditCard, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGroups }     from '../../hooks/useGroups.js';
import { useAuthStore }  from '../../store/authStore.js';
import Card              from '../../components/ui/Card.jsx';
import Spinner           from '../../components/ui/Spinner.jsx';
import Badge             from '../../components/ui/Badge.jsx';
import { formatCurrency } from '../../lib/utils.js';

function KpiCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-500/10 text-primary-500',
    success: 'bg-success-50 dark:bg-success-500/10 text-success-500',
    warning: 'bg-warning-50 dark:bg-warning-500/10 text-warning-500',
    danger:  'bg-danger-50  dark:bg-danger-500/10  text-danger-500',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${colors[color]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const user              = useAuthStore((s) => s.user);
  const { data: groups, isLoading } = useGroups();

  const activeGroups  = groups?.filter((g) => g.status === 'active')  ?? [];
  const totalGroups   = groups?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Salutation */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour, {user?.firstName} 👋
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Groupes actifs"
          value={activeGroups.length}
          sub={`${totalGroups} au total`}
          color="primary"
        />
        <KpiCard
          icon={CreditCard}
          label="Contributions ce mois"
          value="—"
          sub="Bientôt disponible"
          color="success"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total collecté"
          value="—"
          sub="Bientôt disponible"
          color="warning"
        />
        <KpiCard
          icon={AlertCircle}
          label="En attente"
          value="—"
          sub="Bientôt disponible"
          color="danger"
        />
      </div>

      {/* Groupes actifs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Mes groupes
          </h3>
          <Link
            to="/groups"
            className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>

        {groups?.length === 0 ? (
          <Card className="text-center py-12">
            <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Aucun groupe pour l'instant
            </p>
            <Link
              to="/groups"
              className="inline-block mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Créer votre premier groupe →
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link key={group._id} to={`/groups/${group._id}`}>
                <Card hoverable>
                  <Card.Header>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {group.members?.length ?? 0} membre{group.members?.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={group.status === 'active' ? 'success' : 'neutral'}>
                      {group.status === 'active' ? 'Actif' : group.status}
                    </Badge>
                  </Card.Header>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Objectif</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {formatCurrency(group.settings?.targetAmount ?? 0, group.settings?.currency)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}