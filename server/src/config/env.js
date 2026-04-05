const required = [
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
const mongoMap = {
  development: process.env.MONGODB_URI_DEV,
  test:        process.env.MONGODB_URI_TEST,
  production:  process.env.MONGODB_URI_PROD,
};

const mongoUri = mongoMap[nodeEnv] || process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error(
    `Variable d'environnement MongoDB manquante : MONGODB_URI ou MONGODB_URI_${nodeEnv.toUpperCase()}`
  );
}

export const config = {
  port:              parseInt(process.env.PORT) || 5000,
  nodeEnv,
  mongoUri,
  jwtAccessSecret:   process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret:  process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires:  process.env.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES,
  bcryptRounds:      parseInt(process.env.BCRYPT_ROUNDS) || 10,
  isDevelopment:     nodeEnv === 'development',
  isProduction:      nodeEnv === 'production',
};