const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES',
  'JWT_REFRESH_EXPIRES',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port: Number(process.env.PORT) || 5000,

  nodeEnv,

  mongoUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES,

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,

  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
};