import EmptyState from '../../components/ui/EmptyState.jsx';
import { CreditCard } from 'lucide-react';

export default function ContributionsPage() {
  return (
    <EmptyState
      icon={<CreditCard size={28} />}
      title="Contributions"
      description="Cette section présente l'historique complet et le paiement en ligne."
    />
  );
}