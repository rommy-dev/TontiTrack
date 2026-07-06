import { userService } from './user.service.js';
import { catchAsync }  from '../../utils/catchAsync.js';
import { ValidationError } from '../../utils/ApiError.js';

export const userController = {

  // GET /api/users/me
  getMe: catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user._id);
    res.json({ status: 'success', data: { user } });
  }),

  // PATCH /api/users/me
  updateMe: catchAsync(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json({ status: 'success', data: { user } });
  }),

  // PATCH /api/users/me/email
  updateEmail: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await userService.updateEmail(req.user._id, {
      newEmail: email,
      password,
    });
    res.json({ status: 'success', data: { user } });
  }),

  // PATCH /api/users/me/password
  updatePassword: catchAsync(async (req, res) => {
    const result = await userService.updatePassword(req.user._id, {
      currentPassword: req.body.currentPassword,
      newPassword:     req.body.newPassword,
    });
    // Effacer le cookie refreshToken — l'utilisateur doit se reconnecter
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ status: 'success', data: result });
  }),

  // DELETE /api/users/me
  deleteMe: catchAsync(async (req, res) => {
    await userService.deactivateAccount(req.user._id, { password: req.body.password });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ status: 'success', data: null });
  }),

  // GET /api/users/search?email=...
  // Utilisé par le frontend pour chercher un utilisateur avant de l'ajouter à un groupe
  searchByEmail: catchAsync(async (req, res) => {
    const user = await userService.findByEmail(req.query.email);
    res.json({ status: 'success', data: { user } });
  }),

  // PATCH /api/users/me/avatar
  uploadAvatar: catchAsync(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('Aucune image fournie');
    }
    const user = await userService.updateAvatar(req.user._id, req.file.filename);
    res.json({ status: 'success', data: { user } });
  }),
};