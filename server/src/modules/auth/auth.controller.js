import { authService } from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { config } from '../../config/env.js';

export const authController = {

  register: catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const result = await authService.register({ firstName, lastName, email, password });

    // Refresh token en cookie httpOnly — inaccessible au JavaScript
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   config.isProduction,
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 jours en ms
    });

    res.status(201).json({
      status: 'success',
      data:   { user: result.user, accessToken: result.accessToken },
    });
  }),

  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   config.isProduction,
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: 'success',
      data:   { user: result.user, accessToken: result.accessToken },
    });
  }),

  refresh: catchAsync(async (req, res) => {
    const incomingToken = req.cookies?.refreshToken;
    if (!incomingToken) throw new AuthError('Aucun refresh token fourni');

    const { accessToken, refreshToken } = await authService.refreshAccessToken(incomingToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ status: 'success', data: { accessToken } });
  }),

  logout: catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && req.user) {
      await authService.logout(req.user.id, refreshToken);
    }
    res.clearCookie('refreshToken');
    res.json({ status: 'success', message: 'Déconnecté' });
  }),
};