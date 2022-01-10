/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@sveltejs/kit" />

declare module 'loam';

interface ImportMetaEnv {
  VITE_MAPBOX_ACCESS_TOKEN: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    MAPBOX_UPLOAD_TOKEN: string;
    MAPBOX_USERNAME: string;
    NODE_ENV: 'development' | 'production';
  }
}

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onclickoutside?: (event: CustomEvent) => void;
  }
}
