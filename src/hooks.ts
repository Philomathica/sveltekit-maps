import dotenv from 'dotenv';
dotenv.config();

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = ({ event, resolve }) => {
  return resolve(event);
};
