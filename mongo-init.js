// mongo-init.js
// Exécuté une seule fois à la création du container MongoDB
db = db.getSiblingDB('tontitrack');

const user = _getEnv('MONGO_USER') || 'tontitrack_user';
const pwd  = _getEnv('MONGO_PASSWORD');

db.createUser({
  user: user,
  pwd: pwd,
  roles: [
    { role: 'readWrite', db: 'tontitrack' }
  ]
});

// Index essentiels créés au démarrage
db.users.createIndex({ email: 1 }, { unique: true });
db.contributions.createIndex({ cycleId: 1, userId: 1 }, { unique: true });
db.transactions.createIndex({ groupId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });

print('MongoDB initialisé pour TontiTrack');
