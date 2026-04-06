// src/pages/profile/ProfilePage.jsx
import { useState }      from 'react';
import { User, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuthStore }  from '../../store/authStore.js';
import { authApi }       from '../../api/auth.api.js';
import Card   from '../../components/ui/Card.jsx';
import Input  from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast  from 'react-hot-toast';

const CURRENCIES = [
  { value: 'XAF', label: 'XAF — Franc CFA CEMAC' },
  { value: 'XOF', label: 'XOF — Franc CFA UEMOA' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollar américain' },
  { value: 'GBP', label: 'GBP — Livre sterling' },
];

// ── Section infos personnelles ────────────────────────────────────────────────
function ProfileInfoSection({ user, onUpdate }) {
  const [form,    setForm]    = useState({
    firstName:         user?.firstName         ?? '',
    lastName:          user?.lastName          ?? '',
    phone:             user?.phone             ?? '',
    preferredCurrency: user?.preferredCurrency ?? 'XAF',
  });
  const [loading, setLoading] = useState(false);

  // Formater le numéro de téléphone avec espaces
  const formatPhoneNumber = (value) => {
    // Supprimer tous les caractères non numériques sauf le +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ajouter des espaces tous les 2-3 chiffres pour meilleure lisibilité
    if (cleaned.startsWith('+')) {
      const indicatif = cleaned.slice(0, 3); // +237
      const number = cleaned.slice(3);
      // Grouper par 2-3 chiffres pour le reste
      const groups = number.match(/(\d{2,3})(\d{2,3})(\d{2,3})(\d{1,4})?/);
      if (groups) {
        const formatted = [indicatif, groups[1], groups[2], groups[3], groups[4]].filter(Boolean).join(' ');
        return formatted;
      }
    } else {
      // Format sans indicatif international - grouper par 2-3 chiffres
      const groups = cleaned.match(/(\d{2,3})(\d{2,3})(\d{2,3})(\d{1,4})?/);
      if (groups) {
        return groups.slice(1).filter(Boolean).join(' ');
      }
    }
    
    return cleaned;
  };

  const f = (k) => (e) => {
    if (k === 'phone') {
      const formatted = formatPhoneNumber(e.target.value);
      setForm((s) => ({ ...s, [k]: formatted }));
    } else {
      setForm((s) => ({ ...s, [k]: e.target.value }));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.updateMe(form);
      onUpdate(data.data.user);
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de mise à jour');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10">
            <User size={16} className="text-primary-500" />
          </div>
          <Card.Title>Informations personnelles</Card.Title>
        </div>
      </Card.Header>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {user?.email}
          </p>
          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${
            user?.status === 'active'
              ? 'bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
          }`}>
            {user?.status === 'active' ? 'Compte actif' : user?.status}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            value={form.firstName}
            onChange={f('firstName')}
          />
          <Input
            label="Nom"
            value={form.lastName}
            onChange={f('lastName')}
          />
        </div>

        <Input
          label="Téléphone"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          value={form.phone}
          onChange={f('phone')}
          hint="Utilisé pour les rappels WhatsApp (Phase 4 Partie 3)"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            <Globe size={14} className="inline mr-1.5 text-gray-400" />
            Devise préférée
          </label>
          <select
            value={form.preferredCurrency}
            onChange={f('preferredCurrency')}
            className="input"
          >
            {CURRENCIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="pt-1">
          <Button type="submit" loading={loading}>
            Sauvegarder les modifications
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Section changement de mot de passe ───────────────────────────────────────
function PasswordSection() {
  const [form,    setForm]    = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [show,    setShow]    = useState({
    current: false, new: false, confirm: false,
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const f = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const toggleShow = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  function validate() {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Requis';
    if (form.newPassword.length < 8) e.newPassword = '8 caractères minimum';
    else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = 'Une majuscule requise';
    else if (!/[0-9]/.test(form.newPassword)) e.newPassword = 'Un chiffre requis';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.updatePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe mis à jour. Reconnectez-vous sur vos autres appareils.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mot de passe actuel incorrect');
    } finally {
      setLoading(false);
    }
  }

  const eyeBtn = (k) => (
    <button
      type="button"
      onClick={() => toggleShow(k)}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {show[k] ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning-50 dark:bg-warning-500/10">
            <Lock size={16} className="text-warning-500" />
          </div>
          <Card.Title>Changer le mot de passe</Card.Title>
        </div>
      </Card.Header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Mot de passe actuel"
          type={show.current ? 'text' : 'password'}
          required
          value={form.currentPassword}
          onChange={f('currentPassword')}
          error={errors.currentPassword}
          rightIcon={eyeBtn('current')}
        />
        <Input
          label="Nouveau mot de passe"
          type={show.new ? 'text' : 'password'}
          required
          value={form.newPassword}
          onChange={f('newPassword')}
          error={errors.newPassword}
          rightIcon={eyeBtn('new')}
          hint="8 caractères, une majuscule, un chiffre"
        />
        <Input
          label="Confirmer le nouveau mot de passe"
          type={show.confirm ? 'text' : 'password'}
          required
          value={form.confirmPassword}
          onChange={f('confirmPassword')}
          error={errors.confirmPassword}
          rightIcon={eyeBtn('confirm')}
        />
        <div className="pt-1">
          <Button type="submit" variant="secondary" loading={loading}>
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      <ProfileInfoSection user={user} onUpdate={updateUser} />
      <PasswordSection />
    </div>
  );
}