// src/pages/groups/GroupDetailPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Users } from 'lucide-react';
import { useGroup, useGroupCycles, useGroupDebtSummary, useAddMember } from '../../hooks/useGroups.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import { CycleBadge, ContributionBadge } from '../../components/ui/Badge.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';

// ── Panneau membres ───────────────────────────────────────────────────────────
function MembersPanel({ group }) {
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
                {group.status !== 'completed' && (
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
    const { data: summary } = useGroupDebtSummary(groupId);

    if (isLoading) return <Card><Spinner className="text-primary-500 mx-auto my-8" /></Card>;

    const activeCycle = cycles?.find((c) => c.status === 'active')
        ?? cycles?.[0];

    if (!activeCycle) return (
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
                <Card.Title>Cycle #{activeCycle.cycleNumber}</Card.Title>
                <CycleBadge status={activeCycle.status} />
            </Card.Header>

            <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                    { label: 'Objectif', value: formatCurrency(activeCycle.targetAmount, currency) },
                    { label: 'Échéance', value: formatDate(activeCycle.dueDate) },
                    { label: 'Début', value: formatDate(activeCycle.startDate) },
                    {
                        label: 'Bénéficiaire', value: activeCycle.beneficiaryId
                            ? `${activeCycle.beneficiaryId.firstName} ${activeCycle.beneficiaryId.lastName}`
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

            {activeCycle.contributions?.length ? (
                <div className="space-y-3">
                    {activeCycle.contributions.map((c) => (
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
                        {group.status === 'draft' && (
                            <Button size="sm" variant="success">
                                Activer le groupe
                            </Button>
                        )}
                        {group.status === 'active' && (
                            <Button size="sm" leftIcon={<Users size={14} />}>
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
                    <MembersPanel group={group} />
                </div>

                {/* Colonne droite — cycle + contributions */}
                <div className="lg:col-span-2">
                    <CyclePanel
                        groupId={group._id}
                        currency={group.settings?.currency}
                    />
                </div>
            </div>
        </div>
    );
}