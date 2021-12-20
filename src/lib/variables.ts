export const mapbox = {
  baseUploadUrl: `https://api.mapbox.com/uploads/v1/${import.meta.env.VITE_MAPBOX_USERNAME}`,
  baseTilesetUrl: 'https://api.mapbox.com/tilesets/v1',
  uploadToken: import.meta.env.VITE_MAPBOX_UPLOAD_TOKEN, // scope is uploads:read and uploads:write
  username: import.meta.env.VITE_MAPBOX_USERNAME,
};
