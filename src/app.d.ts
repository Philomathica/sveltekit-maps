/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@sveltejs/kit" />

declare module 'loam';
declare module 'geojson-validation';

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

// See https://kit.svelte.dev/docs#typescript
// for information about these interfaces
declare namespace App {
  interface Locals {
    user: User;
  }

  interface Platform {}

  interface Session {
    user: User;
  }

  interface Stuff {}
}
