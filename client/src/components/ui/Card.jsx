// src/components/ui/Card.jsx
import { cn } from '../../lib/utils.js';

export default function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  onClick,
}) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800/60',
        'border border-gray-100 dark:border-gray-700/60',
        'rounded-xl shadow-card',
        'transition-all duration-150',
        paddings[padding],
        hoverable && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// Sous-composants pour structure interne cohérente
Card.Header = function CardHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  );
};

Card.Body = function CardBody({ children, className }) {
  return <div className={cn('', className)}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }) {
  return (
    <div className={cn(
      'mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60',
      'flex items-center justify-between',
      className
    )}>
      {children}
    </div>
  );
};