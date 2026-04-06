import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search } from 'lucide-react';
import { useGroups, useCreateGroup } from '../../hooks/useGroups.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatCurrency } from '../../lib/utils.js';
import { SkeletonGroupCard } from '../../components/ui/Skeleton.jsx';

// ── Modal de création de groupe ───────────────────────────────────────────────
function CreateGroupModal({ onClose }) {
    const [form, setForm] = useState({
        name: '', type: 'tontine', currency: 'XAF', targetAmount: '',
        frequency: 'monthly', penaltyRate: '5', gracePeriodDays: '3',
        allowPartialPay: true,
    });
    const [errors, setErrors] = useState({});
    const { mutate: create, isPending } = useCreateGroup();

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom requis';
        if (!form.targetAmount ||
            Number(form.targetAmount) <= 0) e.targetAmount = 'Montant invalide';
        setErrors(e);
        return !Object.keys(e).length;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;
        create({
            name: form.name,
            type: form.type,
            settings: {
                targetAmount: Number(form.targetAmount),
                currency: form.currency,
                frequency: form.frequency,
                penaltyRate: Number(form.penaltyRate) / 100,
                gracePeriodDays: Number(form.gracePeriodDays),
                allowPartialPay: form.allowPartialPay,
            },
        }, { onSuccess: onClose });
    }

    const f = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Nouveau groupe
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nom du groupe"
                        required
                        placeholder="Tontine Famille Martin"
                        value={form.name}
                        onChange={f('name')}
                        error={errors.name}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                Type
                            </label>
                            <select
                                value={form.type}
                                onChange={f('type')}
                                className="input"
                            >
                                <option value="tontine">Tontine rotative</option>
                                <option value="caisse">Caisse commune</option>
                                <option value="epargne">Épargne collective</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                Devise
                            </label>
                            <select value={form.currency} onChange={f('currency')} className="input">
                                <option value="XAF">XAF (Franc CFA)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="USD">USD (Dollar)</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Montant cible par cycle"
                        required
                        type="number"
                        min="1"
                        placeholder="50000"
                        value={form.targetAmount}
                        onChange={f('targetAmount')}
                        error={errors.targetAmount}
                        hint={`Montant total que le groupe collecte par cycle (en ${form.currency})`}
                    />

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                Fréquence
                            </label>
                            <select value={form.frequency} onChange={f('frequency')} className="input">
                                <option value="weekly">Hebdo</option>
                                <option value="biweekly">Bi-mensuel</option>
                                <option value="monthly">Mensuel</option>
                            </select>
                        </div>
                        <Input
                            label="Pénalité (%)"
                            type="number" min="0" max="50"
                            value={form.penaltyRate}
                            onChange={f('penaltyRate')}
                        />
                        <Input
                            label="Délai grâce (j)"
                            type="number" min="0" max="30"
                            value={form.gracePeriodDays}
                            onChange={f('gracePeriodDays')}
                        />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.allowPartialPay}
                            onChange={(e) => setForm((s) => ({ ...s, allowPartialPay: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                            Autoriser les paiements partiels
                        </span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" fullWidth loading={isPending}>
                            Créer le groupe
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function GroupsPage() {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const { data: groups, isLoading } = useGroups();

    const filtered = groups?.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const statusVariant = {
        active: 'success',
        draft: 'neutral',
        paused: 'warning',
        completed: 'neutral',
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Actions simulées */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-sm">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Grille de skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonGroupCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center gap-3">
                <div className="flex-1 max-w-sm">
                    <Input
                        placeholder="Rechercher un groupe..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={16} />}
                    />
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    leftIcon={<Plus size={16} />}
                >
                    Nouveau groupe
                </Button>
            </div>

            {/* Liste */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Users size={28} />}
                    title="Aucun groupe trouvé"
                    description={search
                        ? `Aucun résultat pour "${search}"`
                        : 'Créez votre premier groupe pour commencer.'}
                    action={!search ? {
                        label: 'Créer un groupe',
                        onClick: () => setShowModal(true),
                    } : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((group) => (
                        <Link key={group._id} to={`/groups/${group._id}`}>
                            <Card hoverable>
                                <Card.Header>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                            {group.name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                                            {group.type} · {group.members?.length ?? 0} membre{(group.members?.length ?? 0) > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <Badge variant={statusVariant[group.status] || 'neutral'}>
                                        {group.status === 'active' ? 'Actif'
                                            : group.status === 'draft' ? 'Brouillon'
                                                : group.status === 'paused' ? 'Pausé'
                                                    : 'Terminé'}
                                    </Badge>
                                </Card.Header>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 dark:text-gray-500">Objectif cycle</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {formatCurrency(group.settings?.targetAmount ?? 0, group.settings?.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 dark:text-gray-500">Fréquence</span>
                                        <span className="text-gray-600 dark:text-gray-300 capitalize">
                                            {group.settings?.frequency === 'monthly' ? 'Mensuel'
                                                : group.settings?.frequency === 'weekly' ? 'Hebdo'
                                                    : 'Bi-mensuel'}
                                        </span>
                                    </div>
                                </div>

                                <Card.Footer>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        Devise : {group.settings?.currency}
                                    </span>
                                    <span className="text-xs text-primary-500 font-medium">
                                        Voir le détail →
                                    </span>
                                </Card.Footer>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {showModal && <CreateGroupModal onClose={() => setShowModal(false)} />}
        </div>
    );
}