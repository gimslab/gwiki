import dotenv from 'dotenv';

dotenv.config();

const getConfig = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config = {
  dataDirectoryPath: getConfig('DATA_DIRECTORY_PATH'),
  adminUsername: getConfig('ADMIN_USERNAME'),
  adminPasswordHash: getConfig('ADMIN_PASSWORD_HASH'),
  jwtSecret: getConfig('JWT_SECRET'),
  port: process.env.PORT || '8080',
};
