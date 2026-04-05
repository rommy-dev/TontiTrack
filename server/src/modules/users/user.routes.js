import { Router }        from 'express';
import { userController } from './user.controller.js';
import { protect }        from '../../middleware/auth.js';
import { validateBody }   from '../../middleware/validate.js';
import { z }              from 'zod';

const router = Router();

// ── Schémas de validation ─────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  firstName:         z.string().min(2).max(50).trim().optional(),
  lastName:          z.string().min(2).max(50).trim().optional(),
  phone:             z.string().max(20).trim().optional(),
  preferredCurrency: z.string().length(3).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ requis',
});

const updateEmailSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'Le nouveau mot de passe doit être différent',
  path: ['newPassword'],
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis pour confirmer la suppression'),
});

// ── Toutes les routes users nécessitent d'être authentifié ───────────────────
router.use(protect);

// Profil du user connecté
router.get('/me',                                                 userController.getMe);
router.patch('/me', validateBody(updateProfileSchema),            userController.updateMe);
router.patch('/me/email',    validateBody(updateEmailSchema),     userController.updateEmail);
router.patch('/me/password', validateBody(updatePasswordSchema),  userController.updatePassword);
router.delete('/me',         validateBody(deleteAccountSchema),   userController.deleteMe);

// Recherche d'un user par email (pour l'ajout dans un groupe)
// ?email=user@example.com
router.get('/search', userController.searchByEmail);

export default router;