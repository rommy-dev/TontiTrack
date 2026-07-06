import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { authService } from '../../src/modules/auth/auth.service.js';

function getRefreshCookie(res) {
  const setCookie = res.headers['set-cookie'] || [];
  const cookie = setCookie.find((entry) => entry.startsWith('refreshToken='));
  if (!cookie) return null;
  return cookie.split(';')[0];
}

describe('POST /api/auth/register', () => {
  it('crée un user et retourne un accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeUndefined();
  });

  it('retourne 409 si l\'email existe déjà', async () => {
    await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      passwordHash: await bcrypt.hash('Password123', 10),
    });
    
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
      });
    
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates le refresh token et délivre un nouvel access token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'Password123',
      });

    const initialCookie = getRefreshCookie(registerRes);
    expect(initialCookie).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', initialCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('refreshToken=')]));
  });

  it('révoque la session si le refresh token a déjà été utilisé', async () => {
    const result = await authService.register({
      firstName: 'Alice',
      lastName: 'Doe',
      email: 'alice.doe@example.com',
      password: 'Password123',
    });

    await authService.refreshAccessToken(result.refreshToken);

    await expect(authService.refreshAccessToken(result.refreshToken)).rejects.toThrow('Session invalide. Reconnectez-vous.');
  });
});