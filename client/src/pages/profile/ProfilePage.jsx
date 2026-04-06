import EmptyState from '../../components/ui/EmptyState.jsx';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <EmptyState
      icon={<User size={28} />}
      title="Mon profil"
      description="Gestion du profil, changement de mot de passe et préférences."
    />
  );
}