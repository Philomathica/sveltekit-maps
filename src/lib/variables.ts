export const mapbox = {
  baseUploadUrl: `https://api.mapbox.com/uploads/v1/${import.meta.env.VITE_MAPBOX_USERNAME}`,
  baseTilesetUrl: 'https://api.mapbox.com/tilesets/v1',
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN, // scope is uploads:read, uploads:write and tilesets:write
  uploadToken: import.meta.env.VITE_MAPBOX_UPLOAD_TOKEN, // scope is uploads:read, uploads:write and tilesets:write
  username: import.meta.env.VITE_MAPBOX_USERNAME,
};
