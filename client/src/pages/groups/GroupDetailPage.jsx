// src/pages/groups/GroupDetailPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Users, Edit, UserCog, Pause, Play, Archive, Settings, FileText, Download, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { useGroup, useActivateGroup, useAddMember, useUpdateGroup, useTransferAdmin, useUpdateGroupStatus } from '../../hooks/useGroups.js';
import { useGroupCycles, useCreateCycle, useCycle } from '../../hooks/useCycles.js';
import { useExportCyclePdf, useExportGroupExcel } from '../../hooks/useExports.js';
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

// ── Modal d'édition du groupe ────────────────────────────────────────────────
function EditGroupModal({ group, onClose }) {
    const [form, setForm] = useState({
        name: group.name || '',
        description: group.description || '',
        type: group.type || 'tontine',
        settings: {
            targetAmount: group.settings?.targetAmount ? group.settings.targetAmount / 100 : '', // Convertir centimes en unités
            frequency: group.settings?.frequency || 'monthly',
            penaltyRate: group.settings?.penaltyRate ? (group.settings.penaltyRate * 100) : 5, // Convertir en pourcentage
            gracePeriodDays: group.settings?.gracePeriodDays || 3,
            allowPartialPay: group.settings?.allowPartialPay ?? true,
            currency: group.settings?.currency || 'XAF',
        },
    });
    const [errors, setErrors] = useState({});
    const { mutate: update, isPending } = useUpdateGroup(group._id);

    function validate() {
        const errs = {};
        if (!form.name || form.name.length < 2) errs.name = 'Le nom doit contenir au moins 2 caractères';
        if (form.description && form.description.length > 500) errs.description = 'La description ne doit pas dépasser 500 caractères';
        if (!form.type) errs.type = 'Le type est requis';
        if (!form.settings.targetAmount || form.settings.targetAmount <= 0) {
            errs.targetAmount = 'Le montant cible doit être positif';
        }
        if (form.settings.penaltyRate < 0 || form.settings.penaltyRate > 100) {
            errs.penaltyRate = 'Le taux de pénalité doit être entre 0 et 100%';
        }
        if (form.settings.gracePeriodDays < 0 || form.settings.gracePeriodDays > 30) {
            errs.gracePeriodDays = 'La période de grâce doit être entre 0 et 30 jours';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        // Convertir les valeurs pour l'API
        const submitData = {
            ...form,
            settings: {
                ...form.settings,
                penaltyRate: form.settings.penaltyRate / 100, // Convertir pourcentage en décimal
            }
        };

        update(submitData, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Modifier le groupe
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nom du groupe"
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        error={errors.name}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                            className="input resize-none h-20"
                            placeholder="Décrivez brièvement ce groupe..."
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Type de groupe *
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                            className="input"
                        >
                            <option value="tontine">Tontine</option>
                            <option value="caisse">Caisse</option>
                            <option value="epargne">Épargne</option>
                        </select>
                        {errors.type && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.type}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Devise *
                        </label>
                        <select
                            value={form.settings.currency}
                            onChange={(e) => setForm((s) => ({
                                ...s,
                                settings: { ...s.settings, currency: e.target.value }
                            }))}
                            className="input"
                        >
                            <option value="XAF">XAF (Franc CFA)</option>
                            <option value="USD">USD (Dollar US)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="GBP">GBP (Livre Sterling)</option>
                            <option value="CHF">CHF (Franc Suisse)</option>
                            <option value="CAD">CAD (Dollar Canadien)</option>
                        </select>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Paramètres Financiers
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Montant cible"
                                type="number"
                                value={form.settings.targetAmount}
                                onChange={(e) => setForm((s) => ({
                                    ...s,
                                    settings: { ...s.settings, targetAmount: parseInt(e.target.value) || '' }
                                }))}
                                error={errors.targetAmount}
                                required
                                min="1"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                    Fréquence *
                                </label>
                                <select
                                    value={form.settings.frequency}
                                    onChange={(e) => setForm((s) => ({
                                        ...s,
                                        settings: { ...s.settings, frequency: e.target.value }
                                    }))}
                                    className="input"
                                >
                                    <option value="weekly">Hebdomadaire</option>
                                    <option value="biweekly">Bi-mensuel</option>
                                    <option value="monthly">Mensuel</option>
                                </select>
                            </div>

                            <Input
                                label="Taux de pénalité (%)"
                                type="number"
                                value={form.settings.penaltyRate}
                                onChange={(e) => setForm((s) => ({
                                    ...s,
                                    settings: { ...s.settings, penaltyRate: parseFloat(e.target.value) || 0 }
                                }))}
                                error={errors.penaltyRate}
                                min="0"
                                max="100"
                                step="0.1"
                            />

                            <Input
                                label="Période de grâce (jours)"
                                type="number"
                                value={form.settings.gracePeriodDays}
                                onChange={(e) => setForm((s) => ({
                                    ...s,
                                    settings: { ...s.settings, gracePeriodDays: parseInt(e.target.value) || 0 }
                                }))}
                                error={errors.gracePeriodDays}
                                min="0"
                                max="30"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.settings.allowPartialPay}
                                    onChange={(e) => setForm((s) => ({
                                        ...s,
                                        settings: { ...s.settings, allowPartialPay: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                    Autoriser les paiements partiels
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" fullWidth loading={isPending}>
                            Mettre à jour
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal de transfert d'admin ───────────────────────────────────────────────
function TransferAdminModal({ group, onClose }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [errors, setErrors] = useState({});
    const { mutate: transfer, isPending } = useTransferAdmin(group._id);

    function validate() {
        const errs = {};
        if (!selectedUserId) errs.userId = 'Veuillez sélectionner un nouveau administrateur';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        transfer({ newAdminId: selectedUserId }, {
            onSuccess: () => onClose(),
        });
    }

    const activeMembers = group.members?.filter(m => m.status === 'active') || [];
    const nonAdminMembers = activeMembers.filter(m => m.role !== 'admin');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Transférer le rôle d'administrateur
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Sélectionnez le membre qui deviendra le nouvel administrateur.
                            Vous perdrez vos droits d'administration.
                        </p>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Nouveau administrateur *
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="input"
                        >
                            <option value="">Choisir un membre...</option>
                            {nonAdminMembers.map((m) => (
                                <option key={m.userId._id} value={m.userId._id}>
                                    {m.userId.firstName} {m.userId.lastName}
                                </option>
                            ))}
                        </select>
                        {errors.userId && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.userId}</p>
                        )}
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                            ⚠️ Cette action est irréversible. Vous ne pourrez plus modifier les paramètres du groupe.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            loading={isPending}
                            disabled={!selectedUserId}
                        >
                            Transférer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal de gestion du statut ───────────────────────────────────────────────
function UpdateStatusModal({ group, onClose }) {
    const [selectedStatus, setSelectedStatus] = useState(group.status);
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const { mutate: updateStatus, isPending } = useUpdateGroupStatus(group._id);

    const statusOptions = [
        { value: 'active', label: 'Actif', description: 'Le groupe fonctionne normalement', icon: Play },
        { value: 'paused', label: 'En pause', description: 'Temporairement suspendu', icon: Pause },
        { value: 'completed', label: 'Terminé', description: 'Archivé définitivement', icon: Archive },
    ];

    function validate() {
        const errs = {};
        if (!selectedStatus) errs.status = 'Veuillez sélectionner un statut';
        if (selectedStatus === 'completed' && !reason.trim()) {
            errs.reason = 'Une raison est requise pour archiver le groupe';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        updateStatus({
            status: selectedStatus,
            reason: reason.trim() || undefined
        }, {
            onSuccess: () => onClose(),
        });
    }

    const currentOption = statusOptions.find(opt => opt.value === group.status);
    const selectedOption = statusOptions.find(opt => opt.value === selectedStatus);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Modifier le statut du groupe
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Statut actuel: <span className="font-medium">{currentOption?.label}</span>
                        </p>

                        <div className="space-y-2">
                            {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isCurrent = option.value === group.status;
                                const isSelected = option.value === selectedStatus;

                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={option.value}
                                            checked={isSelected}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <Icon size={16} className="text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {option.label}
                                                {isCurrent && (
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                        (actuel)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {option.description}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        {errors.status && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.status}</p>
                        )}
                    </div>

                    {selectedStatus === 'completed' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                Raison de l'archivage *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="input resize-none h-20"
                                placeholder="Expliquez pourquoi ce groupe est terminé..."
                            />
                            {errors.reason && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.reason}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            loading={isPending}
                            disabled={selectedStatus === group.status}
                        >
                            Mettre à jour
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
    const { download: downloadPdf, loading: pdfLoading } = useExportCyclePdf();
    const { download: downloadExcel, loading: excelLoading } = useExportGroupExcel();
    const [exportOpen, setExportOpen] = useState(false);

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
                <div className="flex items-center gap-2">
                    <CycleBadge status={cycle.status} />
                    <div className="relative inline-block text-left">
                        <Button
                            size="sm"
                            variant="ghost"
                            loading={pdfLoading || excelLoading}
                            onClick={() => setExportOpen(!exportOpen)}
                            leftIcon={<Download size={14} />}
                            rightIcon={<ChevronDown size={14} className={`transform transition-transform ${exportOpen ? 'rotate-180' : ''}`} />}
                        >
                            Exporter
                        </Button>
                        {exportOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setExportOpen(false)} 
                                />
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExportOpen(false);
                                            downloadPdf(cycle._id, groupId, `cycle-${cycle.cycleNumber}`);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-colors"
                                    >
                                        <FileText size={14} className="text-red-400" />
                                        <span>Exporter en PDF</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExportOpen(false);
                                            downloadExcel(groupId);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-colors"
                                    >
                                        <FileSpreadsheet size={14} className="text-green-400" />
                                        <span>Exporter en Excel</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
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

                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
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

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {isGroupAdmin && (
                            <>
                                <Button
                                    size="sm"
                                    className="text-gray-500 bg-gray-100 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                    variant="ghost"
                                    leftIcon={<Edit size={14} />}
                                    onClick={() => setShowEditModal(true)}
                                >
                                    Modifier
                                </Button>

                                {group.status !== 'completed' && (
                                    <>
                                        <Button
                                            size="sm"
                                            className="text-gray-500 bg-gray-100 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                            variant="ghost"
                                            leftIcon={<UserCog size={14} />}
                                            onClick={() => setShowTransferAdminModal(true)}
                                        >
                                            Transférer admin
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="text-gray-500 bg-gray-100 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                            variant="ghost"
                                            leftIcon={
                                                group.status === 'paused' ? <Play size={14} /> :
                                                group.status === 'active' ? <Pause size={14} /> :
                                                <Archive size={14} />
                                            }
                                            onClick={() => setShowStatusModal(true)}
                                        >
                                            {group.status === 'paused' ? 'Réactiver' :
                                             group.status === 'active' ? 'Mettre en pause' :
                                             'Archiver'}
                                        </Button>
                                    </>
                                )}
                            </>
                        )}

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
            {showEditModal && (
                <EditGroupModal group={group} onClose={() => setShowEditModal(false)} />
            )}
            {showTransferAdminModal && (
                <TransferAdminModal group={group} onClose={() => setShowTransferAdminModal(false)} />
            )}
            {showStatusModal && (
                <UpdateStatusModal group={group} onClose={() => setShowStatusModal(false)} />
            )}
        </div>
    );
}
