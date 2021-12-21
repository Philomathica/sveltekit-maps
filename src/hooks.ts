import cookie from 'cookie';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = ({ request, resolve }) => {
  const cookies = cookie.parse(request.headers.cookie || '');
  request.locals.tileset = cookies.tileset;

  return resolve(request);
};
