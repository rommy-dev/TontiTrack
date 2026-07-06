// Exécuté avant tous les tests
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; 

// Une vraie DB MongoDB en mémoire — rapide, isolée, sans side-effects
let mongoServer;

beforeAll(async () => {
  // Configuration pour éviter les warnings de dépréciation
  mongoose.set('strictQuery', false);

  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'tontitrack-test' },
    replSet: { count: 1 },
  });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Nettoyage entre les tests — chaque test repart sur une DB vide
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});