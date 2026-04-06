import { cn } from '../../lib/utils.js';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

export default function Spinner({ size = 'md', className }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className
      )}
    />
  );
}