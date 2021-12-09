/// <reference types="@sveltejs/kit" />

declare module 'loam';

interface ImportMetaEnv {
  VITE_MAPBOX_UPLOAD_TOKEN: string;
}
