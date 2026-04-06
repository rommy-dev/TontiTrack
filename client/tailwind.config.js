// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  // "class" = dark mode piloté par la classe .dark sur <html>
  // C'est le mode le plus fiable car tu contrôles le toggle toi-même
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // ── Primary (confiance / argent / tontine) ──────────────────────────
        primary: {
          50:  '#f3faf7',
          100: '#dff3ea',
          200: '#bfe7d4',
          300: '#8fd3b5',
          400: '#5dbb95',
          500: '#2f9e73',  // base — boutons, liens actifs
          600: '#257f5c',  // hover
          700: '#1f684c',  // pressed
          800: '#1a533d',  // dark mode base
        },

        // ── Sémantique financière ─────────────────────────────────────────────
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#15803d',  // paiement OK, cycle complété
          600: '#166534',  // hover success
          700: '#14532d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',  // retard léger, grace period
          600: '#b45309',  // hover warning
          700: '#92400e',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',  // impayé critique, erreur
          600: '#b91c1c',  // hover danger
          700: '#991b1b',
        },

        // ── Neutral (plus chaud, moins "tech") ──────────────────────────────
        gray: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },

      // ── Typographie ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Espacement personnalisé ───────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ── Box shadows — adaptés au thème financier ──────────────────────────
      boxShadow: {
        'card':  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'modal': '0 20px 60px -10px rgb(0 0 0 / 0.25)',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.15s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
      },
    },
  },

  plugins: [],
};