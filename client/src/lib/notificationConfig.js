import {
  AlertTriangle, CheckCircle,
  PlayCircle, Users, AlertCircle, Bell,
  ArrowDownLeft,
} from 'lucide-react';

export const NOTIF_CONFIG = {
  payment_reminder: {
    icon:    Bell,
    color:   'text-primary-500',
    bg:      'bg-primary-50 dark:bg-primary-500/10',
    label:   'Rappel',
  },
  payment_late: {
    icon:    AlertTriangle,
    color:   'text-danger-500',
    bg:      'bg-danger-50 dark:bg-danger-500/10',
    label:   'Retard',
  },
  payment_confirmed: {
    icon:    CheckCircle,
    color:   'text-success-500',
    bg:      'bg-success-50 dark:bg-success-500/10',
    label:   'Confirmé',
  },
  cycle_started: {
    icon:    PlayCircle,
    color:   'text-primary-500',
    bg:      'bg-primary-50 dark:bg-primary-500/10',
    label:   'Nouveau cycle',
  },
  cycle_completed: {
    icon:    CheckCircle,
    color:   'text-success-500',
    bg:      'bg-success-50 dark:bg-success-500/10',
    label:   'Cycle terminé',
  },
  member_joined: {
    icon:    Users,
    color:   'text-primary-500',
    bg:      'bg-primary-50 dark:bg-primary-500/10',
    label:   'Nouveau membre',
  },
  penalty_applied: {
    icon:    AlertCircle,
    color:   'text-warning-500',
    bg:      'bg-warning-50 dark:bg-warning-500/10',
    label:   'Pénalité',
  },
  payout_received: {
    icon:    ArrowDownLeft,
    color:   'text-success-500',
    bg:      'bg-success-50 dark:bg-success-500/10',
    label:   'Versement',
  },
};