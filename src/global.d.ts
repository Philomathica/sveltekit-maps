/// <reference types="@sveltejs/kit" />

declare module 'loam';

interface ImportMetaEnv {
  VITE_MAPBOX_ACCESS_TOKEN: string;
  VITE_MAPBOX_UPLOAD_TOKEN: string;
  VITE_MAPBOX_USERNAME: string;
}
