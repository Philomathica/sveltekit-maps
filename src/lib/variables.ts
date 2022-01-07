import { browser } from '$app/env';

export const mapbox = {
  baseTilesetUrl: 'https://api.mapbox.com/tilesets/v1',
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  baseUploadUrl: `https://api.mapbox.com/uploads/v1/${getServerEnvVar('MAPBOX_USERNAME')}`,
  uploadToken: getServerEnvVar('MAPBOX_UPLOAD_TOKEN'), // scope is uploads:read, uploads:write and tilesets:write
  username: getServerEnvVar('MAPBOX_USERNAME'),
};

export const mongodb = {
  mongodbUri: getServerEnvVar('MONGODB_URI'), // scope is uploads:read, uploads:write and tilesets:write
};

function getServerEnvVar(key: keyof NodeJS.ProcessEnv) {
  if (browser) {
    return;
  }

  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }

  return value;
}
