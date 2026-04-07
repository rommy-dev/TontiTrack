import request from 'supertest';
import app     from '../../src/app.js';
import { User  } from '../../src/modules/users/user.model.js';
import { Notification } from '../../src/modules/notifications/notification.model.js';

// Helper : crée un user et retourne son token
async function createUserAndLogin(email = 'test@test.com') {
  await request(app).post('/api/auth/register').send({
    firstName: 'Test', lastName: 'User', email, password: 'Test1234!',
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Test1234!' });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id };
}

describe('Groups API', () => {
  let token, userId;

  beforeEach(async () => {
    ({ token, userId } = await createUserAndLogin());
  });

  describe('POST /api/groups', () => {
    const validGroup = {
      name: 'Tontine Famille',
      type: 'tontine',
      settings: { targetAmount: 50000, currency: 'XAF' },
    };

    it('crée un groupe et ajoute le créateur comme admin', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send(validGroup);

      expect(res.status).toBe(201);
      expect(res.body.data.group.name).toBe('Tontine Famille');
      expect(res.body.data.group.members).toHaveLength(1);
      expect(res.body.data.group.members[0].role).toBe('admin');
    });

    it('retourne 401 sans token', async () => {
      const res = await request(app).post('/api/groups').send(validGroup);
      expect(res.status).toBe(401);
    });

    it('retourne 400 si settings.targetAmount manquant', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', type: 'tontine', settings: {} });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/groups/:groupId/members', () => {
    it('ajoute un membre au groupe', async () => {
      // 1. Créer le groupe
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'G1', type: 'tontine', settings: { targetAmount: 10000, currency: 'XAF' } });

      const groupId = groupRes.body.data.group._id;

      // 2. Créer un second user
      await request(app).post('/api/auth/register').send({
        firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: 'Password123!',
      });

      // 3. Ajouter Alice au groupe
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.group.members).toHaveLength(2);
    });

    it('crée une notification quand un membre est ajouté', async () => {
      // 1. Créer le groupe
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'G1', type: 'tontine', settings: { targetAmount: 10000, currency: 'XAF' } });

      const groupId = groupRes.body.data.group._id;

      // 2. Créer un second user
      const registerRes = await request(app).post('/api/auth/register').send({
        firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: 'Password123!',
      });
      const newUserId = registerRes.body.data.user.id;

      // 3. Ajouter Alice au groupe
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'alice@example.com' });

      // 4. Vérifier que la notification a été créée
      const notif = await Notification.findOne({
        userId: newUserId,
        type: 'member_joined',
      });

      expect(notif).toBeDefined();
      expect(notif.title).toContain('G1');
      expect(notif.meta.groupId.toString()).toEqual(groupId.toString());
    });

    it('retourne 409 si le membre est déjà dans le groupe', async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'G1', type: 'tontine', settings: { targetAmount: 10000, currency: 'XAF' } });

      await request(app).post('/api/auth/register')
        .send({ firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', password: 'Password123!' });

      const groupId = groupRes.body.data.group._id;
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'bob@example.com' });

      // Deuxième tentative
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'bob@example.com' });

      expect(res.status).toBe(409);
    });
  });
});