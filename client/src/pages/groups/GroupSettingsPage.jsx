import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Download, FileSpreadsheet, Settings, Shield } from 'lucide-react';
import { useGroup, useTransferAdmin, useUpdateGroup, useUpdateGroupStatus } from '../../hooks/useGroups.js';
import { useAuthStore } from '../../store/authStore.js';
import { useExportGroupExcel } from '../../hooks/useExports.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { formatCurrency } from '../../lib/utils.js';

function GeneralSettings({ group, isAdmin }) {
  const [form, setForm] = useState({
    name: group.name || '',
    description: group.description || '',
    targetAmount: group.settings?.targetAmount ? group.settings.targetAmount / 100 : '',
    frequency: group.settings?.frequency || 'monthly',
    penaltyRate: group.settings?.penaltyRate != null ? group.settings.penaltyRate * 100 : 5,
    gracePeriodDays: group.settings?.gracePeriodDays ?? 3,
    allowPartialPay: group.settings?.allowPartialPay ?? true,
    currency: group.settings?.currency || 'XAF',
  });
  const { mutate: updateGroup, isPending } = useUpdateGroup(group._id);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    updateGroup({
      name: form.name,
      description: form.description,
      settings: {
        targetAmount: Number(form.targetAmount),
        frequency: form.frequency,
        penaltyRate: Number(form.penaltyRate) / 100,
        gracePeriodDays: Number(form.gracePeriodDays),
        allowPartialPay: form.allowPartialPay,
        currency: form.currency,
      },
    });
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10">
            <Settings size={16} className="text-primary-500" />
          </div>
          <Card.Title>Paramètres généraux</Card.Title>
        </div>
      </Card.Header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom du groupe"
          value={form.name}
          onChange={(event) => setValue('name', event.target.value)}
          disabled={!isAdmin}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(event) => setValue('description', event.target.value)}
            disabled={!isAdmin}
            className="input resize-none h-20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Montant cible"
            type="number"
            min="1"
            value={form.targetAmount}
            onChange={(event) => setValue('targetAmount', event.target.value)}
            disabled={!isAdmin}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Devise
            </label>
            <select
              value={form.currency}
              onChange={(event) => setValue('currency', event.target.value)}
              disabled={!isAdmin}
              className="input"
            >
              <option value="XAF">XAF</option>
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Fréquence
            </label>
            <select
              value={form.frequency}
              onChange={(event) => setValue('frequency', event.target.value)}
              disabled={!isAdmin}
              className="input"
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bi-mensuel</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>

          <Input
            label="Pénalité (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.penaltyRate}
            onChange={(event) => setValue('penaltyRate', event.target.value)}
            disabled={!isAdmin}
          />

          <Input
            label="Grâce (jours)"
            type="number"
            min="0"
            max="30"
            value={form.gracePeriodDays}
            onChange={(event) => setValue('gracePeriodDays', event.target.value)}
            disabled={!isAdmin}
          />
        </div>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.allowPartialPay}
            onChange={(event) => setValue('allowPartialPay', event.target.checked)}
            disabled={!isAdmin}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">Paiements partiels autorisés</span>
        </label>

        {isAdmin && (
          <Button type="submit" loading={isPending}>
            Sauvegarder
          </Button>
        )}
      </form>
    </Card>
  );
}

function ExportsSection({ group }) {
  const { download, loading } = useExportGroupExcel();

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success-50 dark:bg-success-500/10">
            <Download size={16} className="text-success-500" />
          </div>
          <Card.Title>Exports</Card.Title>
        </div>
      </Card.Header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Historique des transactions
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {formatCurrency(group.settings?.targetAmount || 0, group.settings?.currency)} cible · {group.members?.length || 0} membre{(group.members?.length || 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          onClick={() => download(group._id, group.name)}
          leftIcon={<FileSpreadsheet size={14} />}
        >
          Excel
        </Button>
      </div>
    </Card>
  );
}

function AdminTransferSection({ group }) {
  const [newAdminId, setNewAdminId] = useState('');
  const navigate = useNavigate();
  const { mutate: transferAdmin, isPending } = useTransferAdmin(group._id);
  const candidates = group.members?.filter((member) => member.status === 'active' && member.role !== 'admin') || [];

  function handleSubmit(event) {
    event.preventDefault();
    if (!newAdminId) return;
    transferAdmin({ newAdminId }, {
      onSuccess: () => navigate(`/groups/${group._id}`),
    });
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning-50 dark:bg-warning-500/10">
            <Shield size={16} className="text-warning-500" />
          </div>
          <Card.Title>Transfert admin</Card.Title>
        </div>
      </Card.Header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Nouveau admin
          </label>
          <select
            value={newAdminId}
            onChange={(event) => setNewAdminId(event.target.value)}
            className="input"
          >
            <option value="">Choisir un membre</option>
            {candidates.map((member) => (
              <option key={member.userId?._id || member.userId} value={member.userId?._id || member.userId}>
                {member.userId?.firstName} {member.userId?.lastName}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="secondary" disabled={!newAdminId} loading={isPending}>
          Transférer
        </Button>
      </form>
    </Card>
  );
}

function DangerZone({ group }) {
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();
  const { mutate: updateStatus, isPending } = useUpdateGroupStatus(group._id);

  function handleArchive() {
    if (confirm !== group.name) return;
    updateStatus({
      status: 'completed',
      reason: `Groupe ${group.name} terminé depuis les paramètres.`,
    }, {
      onSuccess: () => navigate('/groups'),
    });
  }

  return (
    <Card className="border-danger-100 dark:border-danger-500/20">
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-danger-50 dark:bg-danger-500/10">
            <AlertTriangle size={16} className="text-danger-500" />
          </div>
          <Card.Title>Zone de danger</Card.Title>
        </div>
      </Card.Header>

      <div className="space-y-3">
        <Input
          label={`Tapez ${group.name} pour confirmer`}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={group.status === 'completed'}
        />
        <Button
          variant="danger"
          disabled={confirm !== group.name || group.status === 'completed'}
          loading={isPending}
          onClick={handleArchive}
        >
          Terminer définitivement
        </Button>
      </div>
    </Card>
  );
}

export default function GroupSettingsPage() {
  const { groupId } = useParams();
  const user = useAuthStore((state) => state.user);
  const { data: group, isLoading, error } = useGroup(groupId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-32">
        <p className="text-sm text-gray-400 dark:text-gray-500">Groupe introuvable.</p>
        <Link to="/groups" className="text-primary-500 text-sm hover:underline mt-3 inline-block">
          Retour aux groupes
        </Link>
      </div>
    );
  }

  const isAdmin = group.members?.some(
    (member) => (member.userId?._id || member.userId) === user?.id && member.role === 'admin' && member.status === 'active'
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          to={`/groups/${groupId}`}
          className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-3 transition-colors"
        >
          <ChevronLeft size={14} /> {group.name}
        </Link>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Paramètres du groupe
        </h2>
      </div>

      <GeneralSettings group={group} isAdmin={isAdmin} />
      <ExportsSection group={group} />

      {isAdmin && (
        <>
          <AdminTransferSection group={group} />
          <DangerZone group={group} />
        </>
      )}
    </div>
  );
}
