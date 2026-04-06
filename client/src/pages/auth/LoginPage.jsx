// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [errors, setErrors] = useState({});
    const { mutate: login, isPending } = useLogin();

    function validate() {
        const e = {};
        if (!form.email) e.email = 'Email requis';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
        if (!form.password) e.password = 'Mot de passe requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (validate()) login(form);
    }

    return (
        <div>
            {/* En-tête */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Bon retour
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Connectez-vous à votre espace TontiTrack
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                    label="Adresse email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    error={errors.email}
                    leftIcon={<Mail size={16} />}
                />

                <Input
                    label="Mot de passe"
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    error={errors.password}
                    leftIcon={<Lock size={16} />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label={showPass ? 'Masquer' : 'Afficher'}
                        >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    }
                />

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={isPending}
                >
                    Se connecter
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    Créer un compte
                </Link>
            </p>
        </div>
    );
}