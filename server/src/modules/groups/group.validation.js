import { z } from 'zod';

export const createGroupSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type:        z.enum(['tontine', 'caisse', 'epargne']),
  settings: z.object({
    // L'utilisateur envoie des unités entières (ex: 10000 XAF)
    // On convertit en centimes dans le service ou le controller
    targetAmount:    z.number().int().positive(),
    contributionMode:z.enum(['equal', 'custom']).default('equal'),
    frequency:       z.enum(['weekly', 'biweekly', 'monthly']).default('monthly'),
    penaltyRate:     z.number().min(0).max(1).default(0.05),
    gracePeriodDays: z.number().int().min(0).max(30).default(3),
    allowPartialPay: z.boolean().default(true),
    currency:        z.string().length(3).default('XAF'),
  }),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
});

export const updateGroupSchema = z.object({
  // Tous les champs sont optionnels pour une mise à jour partielle
  name:        z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  type:        z.enum(['tontine', 'caisse', 'epargne']).optional(),
  settings: z.object({
    currency: z.string().length(3).optional(),
  }).optional(),
}).strict(); // Reject unknown fields