import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, Users, CreditCard, User,
    LogOut, TrendingUp, X,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useAuthStore } from '../../store/authStore.js';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/groups', icon: Users, label: 'Mes groupes' },
    { to: '/contributions', icon: CreditCard, label: 'Contributions' },
    { to: '/profile', icon: User, label: 'Mon profil' },
];

export default function MobileDrawer({ isOpen, onClose }) {
    const navigate = useNavigate();
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const user = useAuthStore((s) => s.user);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    function handleLogoutClick() {
        setShowLogoutModal(true);
    }

    async function confirmLogout() {
        try {
            await api.post('/auth/logout');
        } catch { /* silencieux — on déconnecte quand même */ }
        clearAuth();
        toast.success('Déconnecté');
        navigate('/login');
        setShowLogoutModal(false);
        onClose();
    }

    function cancelLogout() {
        setShowLogoutModal(false);
    }

    function handleNavLinkClick() {
        onClose();
    }

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <aside className={cn(
                'fixed top-0 left-0 h-full z-50 lg:hidden',
                'bg-white dark:bg-gray-900',
                'border-r border-gray-100 dark:border-gray-800',
                'flex flex-col transition-transform duration-300 ease-in-out',
                'w-72',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>

                {/* ── Header avec logo et bouton fermer ── */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img src="/icon.svg" alt="TontiTrack" className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-base">
                            TontiTrack
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={handleNavLinkClick}
                            className={({ isActive }) => cn(
                                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium',
                                'transition-all duration-150 group gap-3',
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                            )}
                        >
                            <Icon
                                size={18}
                                className={cn(
                                    'flex-shrink-0 transition-transform duration-150',
                                    'group-hover:scale-105'
                                )}
                            />
                            <span className="truncate">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* ── Bas de drawer : user + logout ── */}
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2">
                    <NavLink 
                        to="/profile"
                        onClick={handleNavLinkClick}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 hover:dark:bg-gray-800 transition-all duration-150">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-800">
                            {user.avatar ? (
                                <img
                                    src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/uploads/${user.avatar}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </NavLink>

                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center rounded-lg px-3 py-2 text-sm gap-3 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors duration-150"
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Modal de confirmation de déconnexion */}
            <Modal
                isOpen={showLogoutModal}
                onClose={cancelLogout}
                title="Confirmation de déconnexion"
                size="sm"
                closeOnBackdropClick={true}
                closeOnEscape={true}
            >
                <Modal.Body>
                    <Modal.Description>
                        Êtes-vous sûr de vouloir vous déconnecter ?
                    </Modal.Description>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        onClick={cancelLogout}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded-lg',
                            'text-gray-600 dark:text-gray-400',
                            'bg-gray-100 dark:bg-gray-700',
                            'hover:bg-gray-200 dark:hover:bg-gray-600',
                            'transition-colors duration-150'
                        )}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={confirmLogout}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded-lg',
                            'text-white',
                            'bg-primary-500',
                            'hover:bg-primary-600',
                            'transition-colors duration-150'
                        )}
                    >
                        Se déconnecter
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
