// src/components/ui/ProgressBar.jsx
import { cn } from '../../lib/utils.js';
import { progressPercent } from '../../lib/utils.js';

// Couleur dynamique selon le pourcentage — logique financière
function resolveColor(percent) {
  if (percent >= 100) return 'bg-success-500';
  if (percent >= 60)  return 'bg-primary-500';
  if (percent >= 30)  return 'bg-warning-500';
  return 'bg-danger-500';
}

export default function ProgressBar({
  value,           // montant payé (centimes)
  max,             // montant attendu (centimes)
  showLabel = true,
  size = 'md',
  className,
}) {
  const percent = progressPercent(value, max);
  const color   = resolveColor(percent);

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progression</span>
          <span className={cn('text-xs font-semibold', {
            'text-success-600 dark:text-success-400': percent >= 100,
            'text-primary-600 dark:text-primary-400': percent >= 60 && percent < 100,
            'text-warning-600 dark:text-warning-400': percent >= 30 && percent < 60,
            'text-danger-600  dark:text-danger-400':  percent < 30,
          })}>
            {percent}%
          </span>
        </div>
      )}

      <div className={cn(
        'w-full rounded-full overflow-hidden',
        'bg-gray-100 dark:bg-gray-700/60',
        heights[size]
      )}>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${Math.min(100, percent)}%` }}
          className={cn(
            color,
            heights[size],
            'rounded-full transition-all duration-500 ease-out'
          )}
        />
      </div>
    </div>
  );
}