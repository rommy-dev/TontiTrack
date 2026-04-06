import { cn } from '../../lib/utils.js';
import { contributionStatusConfig, cycleStatusConfig } from '../../lib/utils.js';

const variants = {
  primary: 'bg-primary-50  text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
  success: 'bg-success-50  text-success-600 dark:bg-success-500/10 dark:text-success-400',
  warning: 'bg-warning-50  text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  danger:  'bg-danger-50   text-danger-600  dark:bg-danger-500/10  dark:text-danger-400',
  neutral: 'bg-gray-100    text-gray-600    dark:bg-gray-700       dark:text-gray-300',
};

export default function Badge({ children, variant = 'neutral', dot = false, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-dot', {
          'bg-primary-500': variant === 'primary',
          'bg-success-500': variant === 'success',
          'bg-warning-500': variant === 'warning',
          'bg-danger-500':  variant === 'danger',
          'bg-gray-400':    variant === 'neutral',
        })} />
      )}
      {children}
    </span>
  );
}

// Badge spécialisé pour le statut d'une contribution
export function ContributionBadge({ status }) {
  const { label, className } = contributionStatusConfig(status);
  const variantMap = {
    'badge-success': 'success',
    'badge-warning': 'warning',
    'badge-danger':  'danger',
    'badge-neutral': 'neutral',
    'badge-primary': 'primary',
  };
  return <Badge variant={variantMap[className] || 'neutral'}>{label}</Badge>;
}

// Badge spécialisé pour le statut d'un cycle
export function CycleBadge({ status }) {
  const { label, className } = cycleStatusConfig(status);
  const variantMap = {
    'badge-success': 'success',
    'badge-warning': 'warning',
    'badge-danger':  'danger',
    'badge-neutral': 'neutral',
    'badge-primary': 'primary',
  };
  return (
    <Badge
      variant={variantMap[className] || 'neutral'}
      dot={status === 'active'}
    >
      {label}
    </Badge>
  );
}