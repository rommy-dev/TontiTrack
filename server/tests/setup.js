// Exécuté avant tous les tests
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; 

// Une vraie DB MongoDB en mémoire — rapide, isolée, sans side-effects
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Nettoyage entre les tests — chaque test repart sur une DB vide
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});