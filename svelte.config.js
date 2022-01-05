import dotenv from 'dotenv';
import adapter from '@sveltejs/adapter-netlify';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],

  kit: {
    target: 'body',
    adapter: adapter(),
  },

  vite: {
    define: (() => {
      const result = {};
      const env = dotenv.config().parsed;
      Object.entries(env).forEach(([k, v]) => (result[`process.env.${k}`] = `'${v}'`));
      return result;
    })(),
  },
};

export default config;
