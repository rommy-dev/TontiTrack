import { cn } from '../../lib/utils.js';
import Spinner from './Spinner.jsx';

const variants = {
  primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:ring-danger-500',
  ghost:     'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
  success:   'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500',
};

const sizes = {
  sm:  'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md:  'px-4 py-2   text-sm rounded-lg gap-2',
  lg:  'px-5 py-2.5 text-base rounded-xl gap-2',
  icon:'p-2 rounded-lg',
};

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        'transition-all duration-250 ease-in-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading
        ? <Spinner size="sm" className="text-current" />
        : leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      }
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}