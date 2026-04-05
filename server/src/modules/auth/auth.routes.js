// src/modules/auth/auth.routes.js
import { Router }       from 'express';
import { authController } from './auth.controller.js';
import { protect }        from '../../middleware/auth.js';
import { validateBody }   from '../../middleware/validate.js';
import { z }              from 'zod';

const router = Router();

// ── Schémas de validation ─────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court').max(50).trim(),
  lastName:  z.string().min(2, 'Nom trop court').max(50).trim(),
  email:     z.string().email('Email invalide').toLowerCase().trim(),
  password:  z
    .string()
    .min(8, 'Mot de passe : 8 caractères minimum')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  phone:     z.string().max(20).optional(),
});

const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis'),
});

// ── Routes publiques (pas de protect) ────────────────────────────────────────

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), authController.login);

// POST /api/auth/refresh  — lit le refreshToken dans le cookie httpOnly
router.post('/refresh', authController.refresh);

// ── Routes protégées ─────────────────────────────────────────────────────────

// POST /api/auth/logout — nécessite d'être connecté pour révoquer le bon token
router.post('/logout', protect, authController.logout);

export default router;