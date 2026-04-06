import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const RULES = [
    { test: (p) => p.length >= 8, label: '8 caractères minimum' },
    { test: (p) => /[A-Z]/.test(p), label: 'Une majuscule' },
    { test: (p) => /[0-9]/.test(p), label: 'Un chiffre' },
];

export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const { mutate: register, isPending } = useRegister();

    function validate() {
        const e = {};
        if (!form.firstName.trim()) e.firstName = 'Prénom requis';
        if (!form.lastName.trim()) e.lastName = 'Nom requis';
        if (!form.email) e.email = 'Email requis';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
        if (!RULES.every((r) => r.test(form.password))) {
            e.password = 'Le mot de passe ne respecte pas les règles';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleBlur(field) {
        setTouched((t) => ({ ...t, [field]: true }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        setTouched({ firstName: true, lastName: true, email: true, password: true });
        if (validate()) register(form);
    }

    const passwordStrength = RULES.filter((r) => r.test(form.password)).length;

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Créer un compte
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Rejoignez TontiTrack gratuitement
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Prénom"
                        required
                        placeholder="Alice"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        onBlur={() => handleBlur('firstName')}
                        error={touched.firstName && errors.firstName}
                        leftIcon={<User size={16} />}
                    />
                    <Input
                        label="Nom"
                        required
                        placeholder="Martin"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        onBlur={() => handleBlur('lastName')}
                        error={touched.lastName && errors.lastName}
                    />
                </div>

                <Input
                    label="Adresse email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    onBlur={() => handleBlur('email')}
                    error={touched.email && errors.email}
                    leftIcon={<Mail size={16} />}
                />

                <div>
                    <Input
                        label="Mot de passe"
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        onBlur={() => handleBlur('password')}
                        error={touched.password && errors.password}
                        leftIcon={<Lock size={16} />}
                        rightIcon={
                            <button type="button" onClick={() => setShowPass((v) => !v)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />

                    {/* Indicateur de force */}
                    {form.password && (
                        <div className="mt-2.5 space-y-2">
                            <div className="flex gap-1">
                                {RULES.map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                                            ? passwordStrength === 1 ? 'bg-danger-500'
                                                : passwordStrength === 2 ? 'bg-warning-500'
                                                    : 'bg-success-500'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                        }`} />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {RULES.map(({ test, label }) => (
                                    <span key={label} className={`text-xs flex items-center gap-1 ${test(form.password)
                                            ? 'text-success-600 dark:text-success-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                        }`}>
                                        <span className="text-[10px]">{test(form.password) ? '✓' : '○'}</span>
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Button type="submit" fullWidth size="lg" loading={isPending} className="mt-2">
                    Créer mon compte
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline transition-all duration-200 ease-in-out">
                    Se connecter
                </Link>
            </p>
        </div>
    );
}