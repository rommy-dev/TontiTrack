import { cn } from '../../lib/utils.js';
import Button from './Button.jsx';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      'py-16 px-6',
      className
    )}>
      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant={action.variant || 'primary'} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}