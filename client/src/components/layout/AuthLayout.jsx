import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
            {/* ── Panneau gauche — branding ── */}
            <div
                className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12
                      bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800
                      relative overflow-hidden"
            >
                {/* Formes décoratives de fond */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <span className="text-white font-semibold text-xl">TontiTrack</span>
                    </div>
                </div>

                {/* Tagline centrale */}
                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                        Gérez vos tontines
                        <br />
                        <span className="text-primary-200">en toute transparence</span>
                    </h1>
                    <p className="text-primary-100 text-lg leading-relaxed max-w-md">
                        Contributions automatisées, calculs de dettes précis, historique
                        complet. La gestion financière collective, enfin simple.
                    </p>

                    {/* Stats sociales */}
                    <div className="flex items-center gap-8 pt-4">
                        {[
                            { value: "2 000+", label: "groupes actifs" },
                            { value: "98%", label: "paiements traités" },
                            { value: "0 XAF", label: "de frais cachés" },
                        ].map(({ value, label }) => (
                            <div key={label}>
                                <div className="text-2xl font-bold text-white">{value}</div>
                                <div className="text-xs text-primary-200 mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer branding */}
                <div className="relative z-10">
                    <p className="text-primary-300 text-sm">
                        © {new Date().getFullYear()} TontiTrack — Fait avec soin
                    </p>
                </div>
            </div>

            {/* ── Panneau droit — formulaire ── */}
            <div className="flex-1 flex flex-col">
                {/* Topbar mobile */}
                <div className="flex items-center justify-between p-4 lg:p-6">
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">T</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                            TontiTrack
                        </span>
                    </div>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Zone formulaire */}
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-md animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
