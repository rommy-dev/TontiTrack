// src/pages/groups/GroupDetailPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Users } from 'lucide-react';
import { useGroup, useActivateGroup, useAddMember } from '../../hooks/useGroups.js';
import { useGroupCycles, useCreateCycle, useCycle } from '../../hooks/useCycles.js';
import { useAuthStore } from '../../store/authStore.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import { CycleBadge, ContributionBadge } from '../../components/ui/Badge.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { SkeletonCycleCard, SkeletonMembersList, SkeletonContributionsList } from '../../components/ui/Skeleton.jsx';
import TransactionHistory from '../../components/transactions/TransactionHistory.jsx';

// ── Modal de création de cycle ───────────────────────────────────────────────
function CreateCycleModal({ group, onClose }) {
    const [form, setForm] = useState({
        beneficiaryId: '',
        startDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +30 jours
    });
    const [errors, setErrors] = useState({});
    const { mutate: create, isPending } = useCreateCycle(group._id);

    function validate() {
        const errs = {};
        if (!form.startDate) errs.startDate = 'Date de début requise';
        if (!form.dueDate) errs.dueDate = 'Date d\'échéance requise';
        if (new Date(form.dueDate) <= new Date(form.startDate)) {
            errs.dueDate = 'L\'échéance doit être après le début';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        // Normaliser les dates pour Zod (ajouter :00Z)
        const normalizeDate = (dateStr) => new Date(dateStr).toISOString();

        create({
            beneficiaryId: form.beneficiaryId || undefined,
            startDate: normalizeDate(form.startDate),
            dueDate: normalizeDate(form.dueDate),
        }, {
            onSuccess: () => onClose(),
        });
    }

    const activeMembers = group.members?.filter(m => m.status === 'active') || [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Nouveau cycle
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Bénéficiaire (optionnel)
                        </label>
                        <select
                            value={form.beneficiaryId}
                            onChange={(e) => setForm((s) => ({ ...s, beneficiaryId: e.target.value }))}
                            className="input"
                        >
                            <option value="">Aucun bénéficiaire</option>
                            {activeMembers.map((m) => (
                                <option key={m.userId._id} value={m.userId._id}>
                                    {m.userId.firstName} {m.userId.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Date de début"
                        type="datetime-local"
                        value={form.startDate}
                        onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                        error={errors.startDate}
                        required
                    />

                    <Input
                        label="Date d'échéance"
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))}
                        error={errors.dueDate}
                        required
                    />

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" fullWidth loading={isPending}>
                            Créer le cycle
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Panneau membres ───────────────────────────────────────────────────────────
function MembersPanel({ group, isGroupAdmin }) {
    if (!group.members) return <SkeletonMembersList />;

    const [email, setEmail] = useState('');
    const [showForm, setShowForm] = useState(false);
    const { mutate: addMember, isPending } = useAddMember(group._id);

    function handleAdd(e) {
        e.preventDefault();
        if (!email) return;
        addMember({ email }, {
            onSuccess: () => { setEmail(''); setShowForm(false); },
        });
    }

    return (
        <Card>
            <Card.Header>
                <Card.Title>Membres ({group.members?.length ?? 0})</Card.Title>
                {group.status !== 'completed' && isGroupAdmin && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowForm((v) => !v)}
                        leftIcon={<UserPlus size={14} />}
                    >
                        Ajouter
                    </Button>
                )}
            </Card.Header>

            {showForm && (
                <form onSubmit={handleAdd} className="mb-4 flex gap-2">
                    <Input
                        placeholder="email@exemple.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" size="sm" loading={isPending}>
                        OK
                    </Button>
                </form>
            )}

            <div className="space-y-2">
                {group.members?.map((m) => (
                    <div
                        key={m.userId?._id || m.userId}
                        className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                                {m.userId?.firstName?.[0] ?? '?'}
                                {m.userId?.lastName?.[0] ?? ''}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                {m.userId?.firstName} {m.userId?.lastName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {m.userId?.email}
                            </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.role === 'admin'
                                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                            {m.role === 'admin' ? 'Admin' : 'Membre'}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Panneau cycle actif ───────────────────────────────────────────────────────
function CyclePanel({ groupId, currency }) {
    const { data: cycles, isLoading } = useGroupCycles(groupId);

    const activeCycle = cycles?.find((c) => c.status === 'active')
        ?? cycles?.find((c) => c.status === 'pending')
        ?? cycles?.slice(-1)[0]; // Prend le cycle le plus récent si aucun actif/en attente

    const { data: cycleData } = useCycle(groupId, activeCycle?._id);

    if (isLoading) return <SkeletonCycleCard />;

    const cycle = cycleData?.cycle || activeCycle;
    const contributions = cycleData?.contributions || [];

    if (!cycle) return (
        <Card>
            <div className="text-center py-8">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    Aucun cycle actif
                </p>
            </div>
        </Card>
    );

    return (
        <Card>
            <Card.Header>
                <Card.Title>Cycle #{cycle.cycleNumber}</Card.Title>
                <CycleBadge status={cycle.status} />
            </Card.Header>

            <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                    { label: 'Objectif', value: formatCurrency(cycle.targetAmount, currency) },
                    { label: 'Échéance', value: formatDate(cycle.dueDate) },
                    { label: 'Début', value: formatDate(cycle.startDate) },
                    {
                        label: 'Bénéficiaire', value: cycle.beneficiaryId
                            ? `${cycle.beneficiaryId.firstName} ${cycle.beneficiaryId.lastName}`
                            : '—'
                    },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</p>
                    </div>
                ))}
            </div>

            {/* Tableau des contributions */}
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Contributions
            </p>

            {contributions?.length ? (
                <div className="space-y-3">
                    {contributions.map((c) => (
                        <div key={c._id}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                    {c.userId?.firstName} {c.userId?.lastName}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {formatCurrency(c.paidAmount, currency)}
                                        {' / '}
                                        {formatCurrency(c.expectedAmount, currency)}
                                    </span>
                                    <ContributionBadge status={c.status} />
                                </div>
                            </div>
                            <ProgressBar
                                value={c.paidAmount}
                                max={c.expectedAmount}
                                showLabel={false}
                                size="sm"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    Aucune contribution enregistrée
                </p>
            )}
        </Card>
    );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function GroupDetailPage() {
    const { groupId } = useParams();
    const { data: group, isLoading, error } = useGroup(groupId);
    const { mutate: activateGroup } = useActivateGroup();
    const { mutate: createCycle } = useCreateCycle(groupId);
    const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
    const user = useAuthStore((s) => s.user);

    // Vérifier si l'utilisateur connecté est admin du groupe
    const isGroupAdmin = group?.members?.some(
        (m) => (m.userId._id || m.userId) === user?.id && m.role === 'admin'
    );

    if (isLoading) return (
        <div className="flex items-center justify-center py-32">
            <Spinner size="lg" className="text-primary-500" />
        </div>
    );

    if (error || !group) return (
        <div className="text-center py-32">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Groupe introuvable ou accès refusé.
            </p>
            <Link to="/groups" className="mt-4 inline-block text-primary-500 hover:underline text-sm">
                ← Retour aux groupes
            </Link>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb + header */}
            <div>
                <Link
                    to="/groups"
                    className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-3 transition-colors"
                >
                    <ChevronLeft size={14} /> Mes groupes
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {group.name}
                        </h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                            {group.type} · {group.settings?.currency} ·{' '}
                            {group.settings?.frequency === 'monthly' ? 'Mensuel'
                                : group.settings?.frequency === 'weekly' ? 'Hebdomadaire'
                                    : 'Bi-mensuel'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {group.status === 'draft' && isGroupAdmin && (
                            <Button size="sm" variant="success" onClick={() => activateGroup(groupId)}>
                                Activer le groupe
                            </Button>
                        )}
                        {group.status === 'active' && isGroupAdmin && (
                            <Button size="sm" leftIcon={<Users size={14} />} onClick={() => setShowCreateCycleModal(true)}>
                                Nouveau cycle
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenu en deux colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne gauche — membres */}
                <div className="lg:col-span-1">
                    <MembersPanel group={group} isGroupAdmin={isGroupAdmin} />
                </div>

                {/* Colonne droite — cycle + contributions */}
                <div className="lg:col-span-2">
                    <CyclePanel
                        groupId={group._id}
                        currency={group.settings?.currency}
                    />
                </div>
            </div>
            <div className="mt-6">
                <TransactionHistory
                    groupId={groupId}
                    title="Historique"
                />
            </div>
            {showCreateCycleModal && (
                <CreateCycleModal group={group} onClose={() => setShowCreateCycleModal(false)} />
            )}
        </div>
    );
}