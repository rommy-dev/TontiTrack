import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore.js';
import { cn } from '../../lib/utils.js';

export default function ThemeToggle({ className }) {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={cn(
        'relative p-2 rounded-lg transition-colors duration-150',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
    >
      {/* Icône soleil — visible en mode clair */}
      <Sun
        size={18}
        className={cn(
          'absolute inset-0 m-auto transition-all duration-200',
          isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
        )}
      />
      {/* Icône lune — visible en mode sombre */}
      <Moon
        size={18}
        className={cn(
          'transition-all duration-200',
          isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
        )}
      />
    </button>
  );
}