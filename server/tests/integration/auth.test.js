import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';

describe('POST /api/auth/register', () => {
  it('crée un user et retourne un accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
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
      password: 'password123',
    });
    
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      });
    
    expect(res.status).toBe(409);
  });
});